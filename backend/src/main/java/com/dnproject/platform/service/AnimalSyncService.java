package com.dnproject.platform.service;

import com.dnproject.platform.domain.Animal;
import com.dnproject.platform.domain.Shelter;
import com.dnproject.platform.domain.constant.*;
import com.dnproject.platform.dto.publicapi.AnimalItem;
import com.dnproject.platform.exception.PublicApiException;
import com.dnproject.platform.repository.AnimalImageRepository;
import com.dnproject.platform.repository.AnimalRepository;
import com.dnproject.platform.repository.FavoriteRepository;
import com.dnproject.platform.repository.ShelterRepository;
import com.dnproject.platform.util.AddressRegionParser;
import com.dnproject.platform.util.KoreanDate;
import com.dnproject.platform.util.SizeEstimate;
import com.dnproject.platform.util.TemporaryNames;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import jakarta.annotation.PostConstruct;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 공공데이터포털 유기동물 API → DB 동기화
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AnimalSyncService {

    private static final String DOG_CODE = "417000";
    private static final String CAT_CODE = "422400";
    private static final DateTimeFormatter API_DATE = DateTimeFormatter.ofPattern("yyyyMMdd");
    /** animal.go.kr 이미지 뷰어 (형식: ?f=/files/shelter/YYYY/MM/파일명) */
    private static final String IMAGE_VIEW_BASE = "https://www.animal.go.kr/front/fileMng/imageView.do?f=";

    /** 품종코드 → 품종명 캐시 (getKindList 결과) */
    private final Map<String, String> kindCodeToName = new ConcurrentHashMap<>();

    private static final java.util.Set<String> observedProcessStates = java.util.concurrent.ConcurrentHashMap
            .newKeySet();

    private final PublicApiService publicApiService;
    private final AnimalRepository animalRepository;
    private final ShelterRepository shelterRepository;
    private final FavoriteRepository favoriteRepository;
    private final AnimalImageRepository animalImageRepository;
    private final PlatformTransactionManager transactionManager;

    private TransactionTemplate requiresNewTransactionTemplate;

    @PostConstruct
    public void init() {
        this.requiresNewTransactionTemplate = new TransactionTemplate(transactionManager);
        this.requiresNewTransactionTemplate.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
    }

    /** 신규 추가용 기간 (7일) - 종료된 동물 삭제 누락 방지 */
    private static final int NEW_DAYS = 7;

    /**
     * addedCount: 신규 추가, updatedCount: 기존 수정, removedCount: 입양·만료 삭제.
     * failedRequestCount/succeededRequestCount: 공공 API 페이지 요청의 실패/성공 횟수.
     * errorMessage: 첫 번째 API 실패 사유 (실패가 없으면 null). 서비스 키는 포함하지 않는다.
     */
    public record SyncResult(int addedCount, int updatedCount, int removedCount,
            int failedRequestCount, int succeededRequestCount, String errorMessage) {

        public SyncResult(int addedCount, int updatedCount, int removedCount) {
            this(addedCount, updatedCount, removedCount, 0, 0, null);
        }

        public int syncedCount() {
            return addedCount + updatedCount;
        }

        /** API 요청이 하나라도 실패했는지 */
        public boolean hasFailures() {
            return failedRequestCount > 0;
        }

        /** API 요청이 모두 실패해 아무 데이터도 받지 못했는지 */
        public boolean completelyFailed() {
            return failedRequestCount > 0 && succeededRequestCount == 0;
        }

        /** 동기화 이력·응답에 남길 실패 요약. 실패가 없으면 null */
        public String failureSummary() {
            if (completelyFailed()) {
                return "공공 API 호출이 모두 실패해 동기화하지 못했습니다. " + errorMessage;
            }
            if (hasFailures()) {
                return "공공 API 호출 " + failedRequestCount + "건 실패. " + errorMessage;
            }
            return null;
        }
    }

    /** 동기화 중 건수와 API 실패를 모으는 누적기 */
    private static final class SyncCounter {
        int added, updated, removed, failedRequests, succeededRequests;
        String firstError;

        SyncResult toResult() {
            return new SyncResult(added, updated, removed, failedRequests, succeededRequests, firstError);
        }
    }

    /**
     * N일치 변경분만 동기화 (증분 동기화).
     * - API의 bgnde/endde는 변경일(수정일) 기준
     * - N일 내 신규 등록 또는 상태 변경된 동물만 API가 반환
     * - full upsert로 모든 필드 갱신
     * - 입양·안락사·자연사·반환 등 보호 종료 동물은 DB에서 삭제
     */
    public SyncResult syncFromPublicApi(int days, Integer maxPages, String speciesFilter) {
        ensureKindMapLoaded();
        LocalDate endDate = KoreanDate.today();
        LocalDate startDate = endDate.minusDays(days);

        SyncCounter counter = new SyncCounter();
        if (speciesFilter == null || "DOG".equalsIgnoreCase(speciesFilter)) {
            syncByUpkind(DOG_CODE, startDate, endDate, maxPages, counter);
        }
        if (speciesFilter == null || "CAT".equalsIgnoreCase(speciesFilter)) {
            syncByUpkind(CAT_CODE, startDate, endDate, maxPages, counter);
        }
        return counter.toResult();
    }

    /**
     * 스케줄용: 1일치 변경분 동기화.
     * state 필터 없이 전체 조회하므로 입양·안락사 등 상태 변경도 자연스럽게 반영됨.
     */
    public SyncResult syncDailySchedule() {
        ensureKindMapLoaded();
        LocalDate endDate = KoreanDate.today();
        LocalDate startDate = endDate.minusDays(NEW_DAYS);

        SyncCounter counter = new SyncCounter();
        syncByUpkind(DOG_CODE, startDate, endDate, null, counter);
        syncByUpkind(CAT_CODE, startDate, endDate, null, counter);
        return counter.toResult();
    }

    /**
     * 경량 정리: API에서 전체 상태 조회 → DB에 있는 동물 중 비보호 상태인 것만 삭제.
     * insert/update 없이 삭제만 수행하므로 빠르고 실패 위험이 낮음.
     */
    public int removeNonProtectedFromApi(int days) {
        LocalDate endDate = KoreanDate.today();
        LocalDate startDate = endDate.minusDays(days);
        int removed = 0;

        for (String upkind : new String[] { DOG_CODE, CAT_CODE }) {
            int pageNo = 1;
            while (true) {
                List<AnimalItem> items;
                try {
                    items = publicApiService.getAbandonedAnimals(
                            null, null, upkind, null, startDate, endDate, pageNo, 100);
                } catch (Exception e) {
                    log.warn("정리용 API 조회 실패 upkind={} page={}: {}", upkind, pageNo, e.getMessage());
                    break;
                }
                if (items == null || items.isEmpty())
                    break;

                for (AnimalItem item : items) {
                    if (item.getDesertionNo() == null || item.getDesertionNo().isBlank())
                        continue;
                    AnimalStatus status = mapStatus(item.getProcessState());
                    if (status != null)
                        continue; // 보호중/임보 → 스킵

                    // 비보호 상태 → DB에 있으면 삭제
                    animalRepository.findByPublicApiAnimalId(item.getDesertionNo())
                            .ifPresent(animal -> {
                                log.info("비보호 동물 삭제: {} (유기번호={}, 상태={})",
                                        animal.getName(), item.getDesertionNo(), item.getProcessState());
                                animalRepository.delete(animal);
                            });
                    removed++;
                }
                if (items.size() < 100)
                    break;
                pageNo++;
            }
        }
        return removed;
    }

    /** 품종코드→품종명 매핑 로드 (동기화 시작 시 1회) */
    private void ensureKindMapLoaded() {
        if (!kindCodeToName.isEmpty())
            return;
        for (String upkind : new String[] { DOG_CODE, CAT_CODE }) {
            publicApiService.getKindList(upkind).forEach(k -> {
                if (k.getKindCd() != null && k.getKNm() != null && !k.getKNm().isBlank()) {
                    kindCodeToName.put(k.getKindCd().trim(), k.getKNm().trim());
                }
            });
        }
        log.debug("품종코드 매핑 로드: {}건", kindCodeToName.size());
    }

    private enum SyncAction {
        ADDED,
        UPDATED,
        REMOVED,
        SKIPPED
    }

    /** 축종 하나를 페이지 단위로 동기화하고 결과를 counter에 더한다. */
    private void syncByUpkind(String upkind, LocalDate startDate, LocalDate endDate, Integer maxPages,
            SyncCounter counter) {
        int pageNo = 1;
        int numOfRows = 100;
        // state 필터 없이 전체 조회 → 입양·안락사 등 상태 변경된 동물도 포함
        while (true) {
            List<AnimalItem> items;
            try {
                items = publicApiService.getAbandonedAnimals(
                        null, null, upkind, null, startDate, endDate, pageNo, numOfRows);
            } catch (PublicApiException e) {
                // 이후 페이지 존재 여부를 알 수 없으므로 이 축종의 동기화를 중단한다.
                log.warn("공공 API 조회 실패로 동기화 중단 upkind={} pageNo={}: {}", upkind, pageNo, e.getMessage());
                counter.failedRequests++;
                if (counter.firstError == null) {
                    counter.firstError = e.getMessage();
                }
                break;
            }
            counter.succeededRequests++;
            if (items == null || items.isEmpty())
                break;
            for (AnimalItem item : items) {
                if (item.getDesertionNo() == null || item.getDesertionNo().isBlank()) {
                    log.warn("desertionNo 없음, 스킵");
                    continue;
                }
                try {
                    SyncAction action = requiresNewTransactionTemplate.execute(status -> upsertAnimal(item));
                    if (action != null) {
                        switch (action) {
                            case ADDED -> counter.added++;
                            case UPDATED -> counter.updated++;
                            case REMOVED -> counter.removed++;
                            case SKIPPED -> {
                                /* ignore */ }
                        }
                    }
                } catch (Exception e) {
                    log.warn("동물 upsert 실패 desertionNo={}: {}", item.getDesertionNo(), e.getMessage());
                }
            }
            if (items.size() < numOfRows)
                break;
            if (maxPages != null && pageNo >= maxPages)
                break;
            pageNo++;
        }
    }

    /** @return ADDED=신규추가, UPDATED=기존수정, REMOVED=보호종료삭제, SKIPPED=무시 */
    private SyncAction upsertAnimal(AnimalItem item) {
        AnimalStatus status = mapStatus(item.getProcessState());
        LocalDate noticeEndDate = parseDate(item.getNoticeEdt());
        var existing = animalRepository.findByPublicApiAnimalId(item.getDesertionNo());

        // 보호 대상이 아니거나 공고 기한이 이미 지난 경우 → 삭제 또는 무시
        boolean isExpired = noticeEndDate != null && noticeEndDate.isBefore(KoreanDate.today());

        if (status == null || isExpired) {
            if (existing.isPresent()) {
                deleteAnimal(existing.get());
                return SyncAction.REMOVED;
            }
            return SyncAction.SKIPPED;
        }

        if (existing.isPresent()) {
            if (!hasChanges(existing.get(), item)) {
                return SyncAction.SKIPPED;
            }
            updateAnimalFromApi(existing.get(), item);
            return SyncAction.UPDATED;
        }
        createAnimalFromApi(item);
        return SyncAction.ADDED;
    }

    /**
     * 동물을 참조하는 찜·이미지를 먼저 지운 뒤 동물을 삭제한다.
     * DB 외래 키에 ON DELETE CASCADE가 없으면(Hibernate가 만든 스키마 등) 참조 행 때문에 삭제가 실패한다.
     */
    private void deleteAnimal(Animal animal) {
        List<Animal> target = List.of(animal);
        favoriteRepository.deleteByAnimalIn(target);
        animalImageRepository.deleteByAnimalIn(target);
        animalRepository.delete(animal);
    }

    private void updateAnimalFromApi(Animal animal, AnimalItem item) {
        animal.setSpecies(mapSpecies(item));
        animal.setBreed(extractBreed(item));
        animal.setName(generateName(item));
        animal.setImageUrl(resolveImageUrl(item));
        animal.setStatus(mapStatus(item.getProcessState()));
        animal.setDescription(buildDescription(item));
        animal.setOrgName(nullToBlank(item.getOrgNm(), 100));
        animal.setChargeName(nullToBlank(item.getChargeNm(), 50));
        animal.setChargePhone(nullToBlank(item.getOfficetel(), 30));
        animal.setNoticeStartDate(parseDate(item.getNoticeSdt()));
        animal.setNoticeEndDate(parseDate(item.getNoticeEdt()));
        // 처음 받은 뒤 공고가 정정되면(중성화 확인, 체중 측정 등) 화면에도 반영한다
        animal.setAge(parseAge(item.getAge()));
        animal.setGender(mapGender(item.getSexCd()));
        animal.setSize(estimateSize(item.getWeight()));
        animal.setWeight(parseWeight(item.getWeight()));
        animal.setNeutered("Y".equalsIgnoreCase(item.getNeuterYn()));
        animalRepository.save(animal);
    }

    /** API 데이터와 DB 데이터의 주요 필드를 비교하여 변경 여부 판단 */
    private boolean hasChanges(Animal animal, AnimalItem item) {
        if (animal.getSpecies() != mapSpecies(item))
            return true;
        if (!java.util.Objects.equals(animal.getBreed(), extractBreed(item)))
            return true;
        if (!java.util.Objects.equals(animal.getImageUrl(), resolveImageUrl(item)))
            return true;
        if (animal.getStatus() != mapStatus(item.getProcessState()))
            return true;
        if (!java.util.Objects.equals(animal.getDescription(), buildDescription(item)))
            return true;
        if (!java.util.Objects.equals(animal.getOrgName(), nullToBlank(item.getOrgNm(), 100)))
            return true;
        if (!java.util.Objects.equals(animal.getChargeName(), nullToBlank(item.getChargeNm(), 50)))
            return true;
        if (!java.util.Objects.equals(animal.getChargePhone(), nullToBlank(item.getOfficetel(), 30)))
            return true;
        if (!java.util.Objects.equals(animal.getNoticeStartDate(), parseDate(item.getNoticeSdt())))
            return true;
        if (!java.util.Objects.equals(animal.getNoticeEndDate(), parseDate(item.getNoticeEdt())))
            return true;
        if (!java.util.Objects.equals(animal.getName(), generateName(item)))
            return true;
        if (!java.util.Objects.equals(animal.getAge(), parseAge(item.getAge())))
            return true;
        if (animal.getGender() != mapGender(item.getSexCd()))
            return true;
        if (animal.getSize() != estimateSize(item.getWeight()))
            return true;
        if (!sameWeight(animal.getWeight(), parseWeight(item.getWeight())))
            return true;
        if (!java.util.Objects.equals(animal.getNeutered(), "Y".equalsIgnoreCase(item.getNeuterYn())))
            return true;
        return false;
    }

    private static boolean sameWeight(BigDecimal a, BigDecimal b) {
        if (a == null || b == null)
            return a == b;
        return a.compareTo(b) == 0;
    }

    private void createAnimalFromApi(AnimalItem item) {
        Shelter shelter = findOrCreateShelter(item);
        Animal animal = Animal.builder()
                .publicApiAnimalId(item.getDesertionNo())
                .shelter(shelter)
                .species(mapSpecies(item))
                .breed(extractBreed(item))
                .name(generateName(item))
                .age(parseAge(item.getAge()))
                .gender(mapGender(item.getSexCd()))
                .size(estimateSize(item.getWeight()))
                .weight(parseWeight(item.getWeight()))
                .description(buildDescription(item))
                .neutered("Y".equalsIgnoreCase(item.getNeuterYn()))
                .imageUrl(resolveImageUrl(item))
                .status(mapStatus(item.getProcessState()))
                .registerDate(parseDate(item.getHappenDt()))
                .noticeStartDate(parseDate(item.getNoticeSdt()))
                .noticeEndDate(parseDate(item.getNoticeEdt()))
                .orgName(nullToBlank(item.getOrgNm(), 100))
                .chargeName(nullToBlank(item.getChargeNm(), 50))
                .chargePhone(nullToBlank(item.getOfficetel(), 30))
                .build();
        animalRepository.save(animal);
    }

    /**
     * popfile1 → popfile2 → popfile → filename 순으로 우선.
     * 실제 API는 popfile1, popfile2에 전체 URL 반환.
     */
    private String resolveImageUrl(AnimalItem item) {
        String raw = null;
        if (item.getPopfile1() != null && !item.getPopfile1().isBlank())
            raw = item.getPopfile1();
        if (raw == null && item.getPopfile2() != null && !item.getPopfile2().isBlank())
            raw = item.getPopfile2();
        if (raw == null && item.getPopfile() != null && !item.getPopfile().isBlank())
            raw = item.getPopfile();
        if (raw == null && item.getFilename() != null && !item.getFilename().isBlank())
            raw = item.getFilename();
        if (raw == null || raw.isBlank())
            return null;
        if (raw.startsWith("http://") || raw.startsWith("https://"))
            return raw;
        String relPath;
        if (raw.startsWith("/files/")) {
            relPath = raw;
        } else if (raw.startsWith("/")) {
            relPath = raw.startsWith("/files") ? raw : "/files" + raw;
        } else if (raw.startsWith("shelter/")) {
            relPath = "/files/" + raw;
        } else {
            LocalDate dt = parseDate(item.getHappenDt());
            String filePart = raw.contains("/") ? raw.substring(raw.lastIndexOf('/') + 1) : raw;
            if (dt != null) {
                relPath = String.format("/files/shelter/%d/%02d/%s", dt.getYear(), dt.getMonthValue(), filePart);
            } else {
                relPath = "/files/shelter/" + filePart;
            }
        }
        return IMAGE_VIEW_BASE + relPath;
    }

    /** description: 발견장소 + 특징 조합 (규격에 맞게, TEXT 컬럼이지만 2000자 제한) */
    private String buildDescription(AnimalItem item) {
        StringBuilder sb = new StringBuilder();
        if (item.getHappenPlace() != null && !item.getHappenPlace().isBlank()) {
            sb.append("[발견장소] ").append(item.getHappenPlace());
        }
        if (item.getSpecialMark() != null && !item.getSpecialMark().isBlank()) {
            if (sb.length() > 0)
                sb.append("\n\n");
            sb.append("[특징] ").append(item.getSpecialMark());
        }
        if (sb.length() == 0)
            return null;
        return sb.length() > 2000 ? sb.substring(0, 2000) : sb.toString();
    }

    /** null/blank면 null, 아니면 trim 후 maxLen 자르기 (관할기관·담당자·담당자연락처용) */
    private static String nullToBlank(String s, int maxLen) {
        if (s == null || s.isBlank())
            return null;
        String t = s.trim();
        return t.length() > maxLen ? t.substring(0, maxLen) : t;
    }

    private Shelter findOrCreateShelter(AnimalItem item) {
        String careNm = item.getCareNm();
        if (careNm == null || careNm.isBlank())
            careNm = "미상";
        return shelterRepository.findFirstByName(careNm)
                .map(s -> {
                    if (s.getRegionSido() == null && s.getAddress() != null && !s.getAddress().isBlank()) {
                        String[] r = AddressRegionParser.parse(s.getAddress());
                        s.setRegionSido(r[0]);
                        s.setRegionSigungu(r[1]);
                        shelterRepository.save(s);
                    }
                    return s;
                })
                .orElseGet(() -> createShelterFromApi(item));
    }

    private Shelter createShelterFromApi(AnimalItem item) {
        String name = item.getCareNm() != null && !item.getCareNm().isBlank() ? item.getCareNm() : "미상";
        String addr = item.getCareAddr() != null ? item.getCareAddr() : "";
        // phone 컬럼이 NOT NULL이라 번호가 없으면 빈 문자열로 둔다. 가짜 번호를 넣으면 화면에 전화 링크로 나간다.
        String tel = item.getCareTel() != null ? item.getCareTel().trim() : "";
        String[] region = AddressRegionParser.parse(addr);
        return shelterRepository.save(Shelter.builder()
                .name(name)
                .address(addr)
                .regionSido(region[0])
                .regionSigungu(region[1])
                .phone(tel)
                .verificationStatus(VerificationStatus.APPROVED)
                .build());
    }

    /** upKindCd(축종코드) 우선. 422400=고양이, 417000=개 */
    private Species mapSpecies(AnimalItem item) {
        if (CAT_CODE.equals(item.getUpKindCd()))
            return Species.CAT;
        if (DOG_CODE.equals(item.getUpKindCd()))
            return Species.DOG;
        String full = item.getKindFullNm();
        if (full != null && (full.contains("고양이") || full.contains("[고양이]")))
            return Species.CAT;
        return Species.DOG;
    }

    /** kindNm(품종명) 우선, 없으면 kindFullNm 파싱, 없으면 kindCd 코드조회 */
    private String extractBreed(AnimalItem item) {
        if (item.getKindNm() != null && !item.getKindNm().isBlank()) {
            String s = item.getKindNm().trim();
            return s.length() > 50 ? s.substring(0, 50) : s;
        }
        String kindCd = item.getKindCd();
        String full = item.getKindFullNm();
        String s = full != null ? full.replaceAll("\\[.*?\\]\\s*", "").trim() : (kindCd != null ? kindCd : "");
        if (s.isEmpty())
            return "믹스";
        String name = kindCodeToName.get(s);
        if (name != null)
            return name.length() > 50 ? name.substring(0, 50) : name;
        if (s.matches("\\d{4,}"))
            return "믹스";
        return s.length() > 50 ? s.substring(0, 50) : s;
    }

    private Integer parseAge(String age) {
        if (age == null || age.isBlank())
            return null;
        try {
            String num = age.replaceAll("[^0-9]", "");
            if (num.length() >= 4) {
                int year = Integer.parseInt(num.substring(0, 4));
                return KoreanDate.today().getYear() - year;
            }
            return Integer.parseInt(num);
        } catch (Exception e) {
            return null;
        }
    }

    private Gender mapGender(String sexCd) {
        if (sexCd == null)
            return null;
        return switch (sexCd.toUpperCase()) {
            case "M" -> Gender.MALE;
            case "F" -> Gender.FEMALE;
            default -> null;
        };
    }

    /**
     * 공공 API processState → AnimalStatus 매핑.
     * 보호중/공고중 → PROTECTED, 임시보호 → FOSTERING,
     * 입양·안락사·자연사·반환 등 → null (DB에 저장하지 않을 대상)
     */
    private AnimalStatus mapStatus(String processState) {
        if (processState == null)
            return AnimalStatus.PROTECTED;
        if (processState.contains("임시보호"))
            return AnimalStatus.FOSTERING;
        if (processState.contains("보호") || processState.contains("공고"))
            return AnimalStatus.PROTECTED;
        // 입양, 안락사, 자연사, 반환 등 → null (제거 대상)
        return null;
    }

    private static final java.util.regex.Pattern FIRST_NUMBER = java.util.regex.Pattern.compile("\\d+(\\.\\d+)?");

    /**
     * 체중 문자열에서 첫 번째 숫자를 kg으로 읽는다 (예: "3.2(Kg)" → 3.2, "1~2(Kg)" → 1).
     * 숫자를 모두 이어 붙이면 "1~2"가 12가 되므로 첫 숫자만 쓴다.
     */
    private BigDecimal parseWeight(String weight) {
        if (weight == null || weight.isBlank())
            return null;
        var m = FIRST_NUMBER.matcher(weight);
        if (!m.find())
            return null;
        try {
            return new BigDecimal(m.group());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private Size estimateSize(String weight) {
        return SizeEstimate.fromWeight(parseWeight(weight));
    }

    private LocalDate parseDate(String dateStr) {
        if (dateStr == null || dateStr.length() < 8)
            return null;
        try {
            return LocalDate.parse(dateStr.substring(0, 8), API_DATE);
        } catch (Exception e) {
            return null;
        }
    }

    /** 공고에 이름이 없으므로 유기번호로 임시 이름을 고정 배정한다. 화면에서는 "임시 이름"으로 표시한다. */
    private String generateName(AnimalItem item) {
        return TemporaryNames.forAnimal(item.getDesertionNo(), mapSpecies(item) == Species.CAT);
    }
}
