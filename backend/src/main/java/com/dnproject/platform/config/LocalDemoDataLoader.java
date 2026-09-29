package com.dnproject.platform.config;

import com.dnproject.platform.domain.Animal;
import com.dnproject.platform.domain.Board;
import com.dnproject.platform.domain.Comment;
import com.dnproject.platform.domain.Favorite;
import com.dnproject.platform.domain.Preference;
import com.dnproject.platform.domain.Shelter;
import com.dnproject.platform.domain.User;
import com.dnproject.platform.domain.constant.AnimalStatus;
import com.dnproject.platform.domain.constant.Gender;
import com.dnproject.platform.domain.constant.Role;
import com.dnproject.platform.domain.constant.Size;
import com.dnproject.platform.domain.constant.Species;
import com.dnproject.platform.domain.constant.VerificationStatus;
import com.dnproject.platform.util.KoreanDate;
import com.dnproject.platform.util.SizeEstimate;
import com.dnproject.platform.util.TemporaryNames;
import com.dnproject.platform.repository.AnimalRepository;
import com.dnproject.platform.repository.BoardRepository;
import com.dnproject.platform.repository.CommentRepository;
import com.dnproject.platform.repository.FavoriteRepository;
import com.dnproject.platform.repository.PreferenceRepository;
import com.dnproject.platform.repository.ShelterRepository;
import com.dnproject.platform.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * local 프로필 전용 데모 데이터.
 * 공공데이터 API 키 없이도 화면을 확인할 수 있도록 보호소·동물·회원·댓글을 넣는다.
 * 게시글은 DevBoardDataLoader(@Order(2))가 넣으므로 그 뒤에 실행한다.
 * 동물 사진은 Unsplash 이미지 URL을 사용한다.
 */
@Slf4j
@Component
@Profile("local")
@Order(3)
@RequiredArgsConstructor
public class LocalDemoDataLoader implements ApplicationRunner {

    public static final String DEMO_USER_EMAIL = "demo@62dn.local";
    public static final String DEMO_USER_PASSWORD = "demo1234!";

    private static final String UNSPLASH = "https://images.unsplash.com/photo-%s?w=600&h=600&fit=crop";

    private final UserRepository userRepository;
    private final ShelterRepository shelterRepository;
    private final AnimalRepository animalRepository;
    private final BoardRepository boardRepository;
    private final CommentRepository commentRepository;
    private final FavoriteRepository favoriteRepository;
    private final PreferenceRepository preferenceRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (animalRepository.count() > 0) {
            return;
        }
        User demoUser = userRepository.findByEmail(DEMO_USER_EMAIL).orElseGet(() -> userRepository.save(User.builder()
                .email(DEMO_USER_EMAIL)
                .password(passwordEncoder.encode(DEMO_USER_PASSWORD))
                .name("김데모")
                .phone("010-0000-0000")
                .role(Role.USER)
                .build()));

        List<Shelter> shelters = shelterRepository.saveAll(List.of(
                shelter("서울 강동 동물보호센터", "서울특별시 강동구 성내로 25", "서울", "강동구", "37.5301", "127.1238", "02-0000-1001"),
                shelter("경기 남양주 동물보호센터", "경기도 남양주시 경춘로 1037", "경기", "남양주시", "37.6360", "127.2165", "031-000-1002"),
                shelter("인천 연수 동물보호센터", "인천광역시 연수구 원인재로 115", "인천", "연수구", "37.4101", "126.6783", "032-000-1003"),
                shelter("대전 유성 동물보호센터", "대전광역시 유성구 대학로 211", "대전", "유성구", "36.3624", "127.3562", "042-000-1004"),
                shelter("부산 해운대 동물보호센터", "부산광역시 해운대구 중동2로 11", "부산", "해운대구", "35.1631", "129.1636", "051-000-1005"),
                shelter("제주 동물보호센터", "제주특별자치도 제주시 광양9길 10", "제주", "제주시", "33.4996", "126.5312", "064-000-1006")));

        LocalDate today = KoreanDate.today();
        List<Animal> animals = new ArrayList<>();
        // 개 12마리
        animals.add(animal(shelters.get(0), Species.DOG, "믹스견", "보리", 2, Gender.MALE, Size.MEDIUM, "12.4",
                "1477884213360-7e9d7dcc1e48", "산책을 좋아하고 사람을 잘 따르는 활발한 아이입니다.", "활발함, 사람 좋아함", true, true, today, 2));
        animals.add(animal(shelters.get(1), Species.DOG, "퍼그", "먹물", 4, Gender.FEMALE, Size.SMALL, "7.8",
                "1517849845537-4d257902454a", "조용하고 느긋한 성격으로 실내 생활에 잘 적응합니다.", "온순함, 느긋함", true, true, today, 5));
        animals.add(animal(shelters.get(2), Species.DOG, "웰시코기", "호두", 1, Gender.MALE, Size.SMALL, "9.1",
                "1537151625747-768eb6cf92b2", "호기심이 많고 장난감 놀이를 좋아하는 어린 강아지입니다.", "호기심 많음", false, true, today, 1));
        animals.add(animal(shelters.get(3), Species.DOG, "비글", "콩이", 3, Gender.FEMALE, Size.MEDIUM, "11.0",
                "1543466835-00a7907e9de1", "밝은 표정으로 늘 꼬리를 흔드는 사교적인 아이입니다.", "사교적, 명랑함", true, true, today, 8));
        animals.add(animal(shelters.get(4), Species.DOG, "요크셔테리어", "밤톨", 1, Gender.MALE, Size.SMALL, "2.3",
                "1546527868-ccb7ee7dfa6a", "작은 체구지만 용감하고 애교가 많습니다.", "애교 많음", false, false, today, 12));
        animals.add(animal(shelters.get(0), Species.DOG, "골든 리트리버", "햇살", 5, Gender.FEMALE, Size.LARGE, "27.5",
                "1552053831-71594a27632d", "순하고 차분해서 아이가 있는 가정에도 잘 어울립니다.", "순함, 차분함", true, true, today, 3));
        animals.add(animal(shelters.get(1), Species.DOG, "골든 리트리버", "누리", 6, Gender.MALE, Size.LARGE, "30.2",
                "1558788353-f76d92427f16", "사람 곁에 있는 것을 좋아하는 든든한 대형견입니다.", "다정함", true, true, today, 20));
        animals.add(animal(shelters.get(2), Species.DOG, "잭 러셀 테리어", "초코", 2, Gender.MALE, Size.SMALL, "6.5",
                "1561037404-61cd46aa615b", "에너지가 넘쳐 매일 충분한 산책이 필요합니다.", "활동적", true, true, today, 6));
        animals.add(animal(shelters.get(3), Species.DOG, "프렌치 불도그", "망고", 3, Gender.FEMALE, Size.SMALL, "10.2",
                "1583337130417-3346a1be7dee", "사람 무릎 위를 좋아하는 애교쟁이입니다.", "애교 많음, 조용함", true, true, today, 15));
        animals.add(animal(shelters.get(4), Species.DOG, "프렌치 불도그", "두부", 2, Gender.MALE, Size.SMALL, "11.4",
                "1583511655857-d19b40a7a54e", "처음엔 낯을 가리지만 금방 친해지는 아이입니다.", "낯가림, 온순함", false, true, today, 25));
        animals.add(animal(shelters.get(5), Species.DOG, "보더콜리 믹스", "구름", 4, Gender.FEMALE, Size.MEDIUM, "16.8",
                "1587300003388-59208cc962cb", "영리해서 기본 훈련을 빠르게 익혔습니다.", "영리함, 활발함", true, true, today, 9));
        animals.add(animal(shelters.get(5), Species.DOG, "골든 리트리버", "보름", 1, Gender.MALE, Size.LARGE, "22.0",
                "1633722715463-d30f4f325e24", "잔디밭 산책을 가장 좋아하는 명랑한 청소년견입니다.", "명랑함", false, true, today, 30));
        // 고양이 8마리
        animals.add(animal(shelters.get(0), Species.CAT, "코리안숏헤어", "나비", 2, Gender.FEMALE, Size.SMALL, "3.9",
                "1495360010541-f48722b34f7d", "조용히 곁을 지켜 주는 차분한 고양이입니다.", "차분함", true, true, today, 4));
        animals.add(animal(shelters.get(1), Species.CAT, "턱시도", "양말", 3, Gender.MALE, Size.SMALL, "4.8",
                "1514888286974-6c03e2ca1dba", "사람 손길을 좋아하고 골골송을 잘 부릅니다.", "사람 좋아함", true, true, today, 7));
        animals.add(animal(shelters.get(2), Species.CAT, "코리안숏헤어", "호랑", 4, Gender.MALE, Size.SMALL, "5.2",
                "1518791841217-8f162f1e1131", "창가에서 햇볕 쬐는 것을 좋아하는 느긋한 고양이입니다.", "느긋함", true, true, today, 11));
        animals.add(animal(shelters.get(3), Species.CAT, "코리안숏헤어", "모찌", 1, Gender.FEMALE, Size.SMALL, "3.1",
                "1543852786-1cf6624b9987", "장난감 낚싯대 놀이를 무척 좋아합니다.", "장난꾸러기", false, true, today, 2));
        animals.add(animal(shelters.get(4), Species.CAT, "메인쿤 믹스", "치즈", 5, Gender.MALE, Size.MEDIUM, "6.7",
                "1573865526739-10659fec78a5", "덩치는 크지만 성격은 누구보다 순한 고양이입니다.", "순함", true, true, today, 18));
        animals.add(animal(shelters.get(5), Species.CAT, "코리안숏헤어", "초록", 2, Gender.FEMALE, Size.SMALL, "4.0",
                "1574158622682-e40e69881006", "초록 눈이 매력적인 호기심 많은 고양이입니다.", "호기심 많음", true, true, today, 14));
        animals.add(animal(shelters.get(0), Species.CAT, "코리안숏헤어", "솜이", 1, Gender.FEMALE, Size.SMALL, "2.2",
                "1592194996308-7b43878e84a6", "사람을 보면 먼저 다가오는 애교 많은 아기 고양이입니다.", "애교 많음", false, false, today, 10));
        Animal fostering = animal(shelters.get(1), Species.CAT, "코리안숏헤어", "귤이", 3, Gender.MALE, Size.SMALL, "5.5",
                "1596854407944-bf87f6fdd49e", "현재 임시보호 가정에서 지내고 있습니다.", "온순함", true, true, today, 21);
        fostering.setStatus(AnimalStatus.FOSTERING);
        animals.add(fostering);
        // 공공데이터로 들어온 동물처럼 보이게 한다: 유기번호가 있고, 이름은 임시 이름이며, 중성화·체중을 모른다
        markAsPublicData(animals.get(9), "448500202600101", false);
        markAsPublicData(animals.get(17), "448500202600102", true);
        animalRepository.saveAll(animals);

        // 마이페이지·추천 화면용: 찜 3마리, 선호 조건 (서울·경기, 1~5살 강아지)
        favoriteRepository.saveAll(List.of(
                Favorite.builder().user(demoUser).animal(animals.get(0)).build(),
                Favorite.builder().user(demoUser).animal(animals.get(5)).build(),
                Favorite.builder().user(demoUser).animal(animals.get(13)).build()));
        preferenceRepository.save(Preference.builder()
                .user(demoUser)
                .species(Species.DOG)
                .minAge(1)
                .maxAge(5)
                .region("서울,경기")
                .build());

        seedComments(demoUser);
        log.info("[local] 데모 데이터 생성: 보호소 {}곳, 동물 {}마리, 데모 회원 {}", shelters.size(), animals.size(), DEMO_USER_EMAIL);
    }

    private void seedComments(User demoUser) {
        List<Board> boards = boardRepository.findAll();
        List<Comment> comments = new ArrayList<>();
        for (Board board : boards) {
            if (board.getTitle().contains("까망이")) {
                comments.add(comment(board, demoUser, "까망이 너무 귀여워요! 행복한 모습 자주 올려 주세요."));
            } else if (board.getTitle().contains("꿀팁")) {
                comments.add(comment(board, demoUser, "처음 방문하기 전에 꼭 필요한 정보네요. 감사합니다."));
            } else if (board.getTitle().contains("산책 봉사")) {
                comments.add(comment(board, demoUser, "저도 이번 주에 신청해 보려고요. 좋은 후기 감사해요!"));
            }
        }
        commentRepository.saveAll(comments);
    }

    private Shelter shelter(String name, String address, String sido, String sigungu, String lat, String lng,
            String phone) {
        return Shelter.builder()
                .name(name)
                .address(address)
                .regionSido(sido)
                .regionSigungu(sigungu)
                .latitude(new BigDecimal(lat))
                .longitude(new BigDecimal(lng))
                .phone(phone)
                .verificationStatus(VerificationStatus.APPROVED)
                .build();
    }

    private Animal animal(Shelter shelter, Species species, String breed, String name, int age, Gender gender,
            Size size, String weight, String photoId, String description, String temperament, boolean neutered,
            boolean vaccinated, LocalDate today, int daysUntilNoticeEnd) {
        return Animal.builder()
                .shelter(shelter)
                .orgName(shelter.getRegionSido() + " " + shelter.getRegionSigungu())
                .chargePhone(shelter.getPhone())
                .species(species)
                .breed(breed)
                .name(name)
                .age(age)
                .gender(gender)
                .size(size)
                .weight(new BigDecimal(weight))
                .description(description)
                .temperament(temperament)
                .healthStatus("양호")
                .neutered(neutered)
                .vaccinated(vaccinated)
                .imageUrl(String.format(UNSPLASH, photoId))
                .status(AnimalStatus.PROTECTED)
                // "새로 들어온 순" 정렬을 확인할 수 있도록 공고 시작일을 동물마다 0~8일 전으로 다르게 둔다
                .registerDate(today.minusDays(daysUntilNoticeEnd % 9))
                .noticeStartDate(today.minusDays(daysUntilNoticeEnd % 9))
                .noticeEndDate(today.plusDays(daysUntilNoticeEnd))
                .build();
    }

    private void markAsPublicData(Animal animal, String desertionNo, boolean weightUnknown) {
        animal.setPublicApiAnimalId(desertionNo);
        animal.setName(TemporaryNames.forAnimal(desertionNo, animal.getSpecies() == Species.CAT));
        animal.setNeutered(false);
        if (weightUnknown) {
            animal.setWeight(null);
        }
        // 공공데이터는 크기를 체중으로 추정하므로 같은 규칙을 적용한다
        animal.setSize(SizeEstimate.fromWeight(animal.getWeight()));
    }

    private Comment comment(Board board, User user, String content) {
        return Comment.builder().board(board).user(user).content(content).build();
    }
}
