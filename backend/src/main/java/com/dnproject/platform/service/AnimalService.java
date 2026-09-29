package com.dnproject.platform.service;

import com.dnproject.platform.domain.Animal;
import com.dnproject.platform.domain.Shelter;
import com.dnproject.platform.domain.constant.AnimalStatus;
import com.dnproject.platform.domain.constant.Gender;
import com.dnproject.platform.domain.constant.Size;
import com.dnproject.platform.domain.constant.Species;

import com.dnproject.platform.dto.response.AnimalResponse;
import com.dnproject.platform.dto.response.AnimalStatsResponse;
import com.dnproject.platform.dto.response.PageResponse;
import com.dnproject.platform.exception.NotFoundException;
import com.dnproject.platform.dto.response.PreferenceResponse;
import com.dnproject.platform.repository.AnimalRepository;
import com.dnproject.platform.repository.ShelterRepository;
import com.dnproject.platform.service.PreferenceService;
import com.dnproject.platform.mapper.AnimalMapper;
import com.dnproject.platform.util.KoreanDate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AnimalService {

    private final AnimalRepository animalRepository;
    private final ShelterRepository shelterRepository;
    private final AnimalSyncService animalSyncService;
    private final PreferenceService preferenceService;
    private final AnimalMapper animalMapper;
    private final com.dnproject.platform.repository.FavoriteRepository favoriteRepository;
    private final com.dnproject.platform.repository.AnimalImageRepository animalImageRepository;

    @Transactional(readOnly = true)
    public PageResponse<AnimalResponse> findAll(Species species, AnimalStatus status, Size size, Gender gender,
            Long shelterId, String region, String sigungu, String search, Pageable pageable) {
        String regionParam = (region != null && !region.isBlank()) ? region.trim() : null;
        String sigunguParam = (sigungu != null && !sigungu.isBlank()) ? sigungu.trim() : null;
        String searchParam = (search != null && !search.isBlank()) ? search.trim() : null;
        Page<Animal> page = animalRepository.findWithFilters(species, status, size, gender, shelterId, regionParam, sigunguParam,
                searchParam, KoreanDate.today(), pageable);
        return animalMapper.toPageResponse(page);
    }

    @Transactional(readOnly = true)
    public AnimalResponse findById(Long id) {
        Animal animal = animalRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("동물을 찾을 수 없습니다. id=" + id));
        return animalMapper.toResponse(animal);
    }

    /**
     * 안락사 D-Day 임박 동물 조회 (렌딩 페이지용)
     */
    @Transactional(readOnly = true)
    public List<AnimalResponse> findUrgentAnimals(int limit) {
        LocalDate today = KoreanDate.today();
        LocalDate maxDate = today.plusYears(1);
        Pageable pageable = org.springframework.data.domain.PageRequest.of(0, limit);

        return animalRepository.findUrgentAnimals(AnimalStatus.PROTECTED, today, maxDate, pageable)
                .getContent()
                .stream()
                .map(animalMapper::toResponse)
                .toList();
    }

    /**
     * 랜딩 실시간 현황. 일주일 안은 오늘(D-Day)부터 7일 뒤(D-7)까지로, 목록의 D-day 강조 기준과 같다.
     * 일일 동기화는 최근 7일치만 다시 조회하므로 공고 마감일이 지난 동물이 DB에 남을 수 있어, 집계에서 뺀다.
     */
    @Transactional(readOnly = true)
    public AnimalStatsResponse getStats() {
        LocalDate today = KoreanDate.today();
        return AnimalStatsResponse.builder()
                .protectedCount(animalRepository.countOpenNotices(AnimalStatus.PROTECTED, today))
                .endingWithinWeekCount(animalRepository.countByStatusAndNoticeEndDateBetween(
                        AnimalStatus.PROTECTED, today, today.plusDays(7)))
                .shelterCount(animalRepository.countSheltersWithOpenNotices(AnimalStatus.PROTECTED, today))
                .build();
    }

    /**
     * 공공데이터포털 유기동물 API → DB 동기화
     * 
     * @param days          최근 N일 데이터
     * @param maxPages      최대 페이지 수 (null이면 전부)
     * @param speciesFilter DOG, CAT 또는 null(전체)
     */
    public AnimalSyncService.SyncResult syncFromPublicApiWithStatus(int days, Integer maxPages, String speciesFilter) {
        return animalSyncService.syncFromPublicApi(days, maxPages, speciesFilter);
    }

    /**
     * 사용자 선호도에 맞는 동물 목록 (종류·나이 범위·크기 필터)
     */
    @Transactional(readOnly = true)
    public PageResponse<AnimalResponse> findRecommended(Long userId, Pageable pageable) {
        PreferenceResponse pref = preferenceService.getByUserId(userId);
        if (pref == null) {
            return PageResponse.<AnimalResponse>builder()
                    .content(List.of())
                    .page(pageable.getPageNumber())
                    .size(pageable.getPageSize())
                    .totalElements(0L)
                    .totalPages(0)
                    .first(true)
                    .last(true)
                    .build();
        }
        Species species = pref.getSpecies();
        Integer minAge = pref.getMinAge();
        Integer maxAge = pref.getMaxAge();
        Size size = pref.getSize();
        List<String> regions = (pref.getRegions() != null && !pref.getRegions().isEmpty())
                ? pref.getRegions().stream().map(String::trim).filter(s -> !s.isBlank()).toList()
                : null;
        List<AnimalStatus> statuses = List.of(AnimalStatus.PROTECTED);
        Page<Animal> page = animalRepository.findRecommended(statuses, species, minAge, maxAge, size, regions,
                KoreanDate.today(), pageable);
        return animalMapper.toPageResponse(page);
    }

    /**
     * 기존 DB에 쌓인 ADOPTED, status=NULL 및 공고 만료 동물 일괄 정리.
     * 
     * @return [adoptedDeleted, nullDeleted, expiredDeleted]
     */
    @Transactional
    public int[] cleanupInvalidStatus() {
        List<Animal> adoptedAnimals = animalRepository.findAllByStatus(AnimalStatus.ADOPTED);
        List<Animal> nullAnimals = animalRepository.findAllByStatusIsNull();
        List<Animal> expiredAnimals = animalRepository.findAllByStatusAndNoticeEndDateBefore(AnimalStatus.PROTECTED,
                KoreanDate.today());

        List<Animal> toDelete = new java.util.ArrayList<>();
        toDelete.addAll(adoptedAnimals);
        toDelete.addAll(nullAnimals);
        toDelete.addAll(expiredAnimals);

        if (!toDelete.isEmpty()) {
            favoriteRepository.deleteByAnimalIn(toDelete);
            animalImageRepository.deleteByAnimalIn(toDelete);
            animalRepository.deleteAllInBatch(toDelete);
        }

        return new int[] { adoptedAnimals.size(), nullAnimals.size(), expiredAnimals.size() };
    }

}
