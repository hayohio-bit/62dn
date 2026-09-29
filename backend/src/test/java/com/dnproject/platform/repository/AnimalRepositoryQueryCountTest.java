package com.dnproject.platform.repository;

import com.dnproject.platform.domain.Animal;
import com.dnproject.platform.domain.Favorite;
import com.dnproject.platform.domain.Shelter;
import com.dnproject.platform.domain.User;
import com.dnproject.platform.domain.constant.AnimalStatus;
import com.dnproject.platform.domain.constant.Gender;
import com.dnproject.platform.domain.constant.Species;
import com.dnproject.platform.mapper.AnimalMapper;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import org.hibernate.SessionFactory;
import org.hibernate.stat.Statistics;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * 동물 목록 조회가 보호소를 동물마다 따로 조회(N+1)하지 않는지 SQL 실행 횟수로 확인한다.
 */
@DataJpaTest(properties = "spring.jpa.properties.hibernate.generate_statistics=true")
@ActiveProfiles("local")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class AnimalRepositoryQueryCountTest {

    private static final int ANIMALS = 5;

    @Autowired
    private AnimalRepository animalRepository;
    @Autowired
    private ShelterRepository shelterRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private FavoriteRepository favoriteRepository;
    @Autowired
    private EntityManager entityManager;
    @Autowired
    private EntityManagerFactory entityManagerFactory;

    private final AnimalMapper animalMapper = new AnimalMapper();
    private Statistics statistics;

    @BeforeEach
    void setUp() {
        for (int i = 0; i < ANIMALS; i++) {
            Shelter shelter = shelterRepository.save(Shelter.builder()
                    .name("보호소" + i).address("서울특별시 중구").regionSido("서울").phone("02-000-000" + i).build());
            animalRepository.save(Animal.builder()
                    .shelter(shelter).species(Species.DOG).status(AnimalStatus.PROTECTED)
                    .imageUrl("https://img.example.test/" + i + ".jpg")
                    .noticeEndDate(LocalDate.now().plusDays(i + 1)).build());
        }
        entityManager.flush();
        entityManager.clear();
        statistics = entityManagerFactory.unwrap(SessionFactory.class).getStatistics();
        statistics.clear();
    }

    private void assertShelterLoadedWithoutExtraQueries(List<Animal> animals, long maxStatements) {
        animals.forEach(animalMapper::toResponse);
        assertThat(animals).hasSize(ANIMALS);
        assertThat(animals).allSatisfy(a -> assertThat(a.getShelter().getName()).startsWith("보호소"));
        assertThat(statistics.getPrepareStatementCount()).isLessThanOrEqualTo(maxStatements);
    }

    @Test
    @DisplayName("동물 목록(findWithFilters)은 보호소를 함께 조회한다")
    void findWithFiltersFetchesShelter() {
        Page<Animal> page = animalRepository.findWithFilters(null, null, null, null, null, null, null, null,
                PageRequest.of(0, 20, Sort.by("noticeEndDate")));
        // 목록 조회 1회 (+ 전체 건수 조회는 결과가 페이지보다 적으면 생략된다)
        assertShelterLoadedWithoutExtraQueries(page.getContent(), 2);
    }

    @Test
    @DisplayName("보호소 조건(지역·보호소명 검색)과 전체 건수는 그대로 동작한다")
    void findWithFiltersKeepsShelterConditions() {
        Page<Animal> byName = animalRepository.findWithFilters(null, null, null, null, null, "서울", null, "보호소1",
                PageRequest.of(0, 20, Sort.by("noticeEndDate")));
        assertThat(byName.getContent()).extracting(a -> a.getShelter().getName()).containsExactly("보호소1");

        Page<Animal> paged = animalRepository.findWithFilters(null, null, null, null, null, "서울", null, null,
                PageRequest.of(0, 2, Sort.by("noticeEndDate")));
        assertThat(paged.getContent()).hasSize(2);
        assertThat(paged.getTotalElements()).isEqualTo(ANIMALS);
    }

    @Test
    @DisplayName("성별 조건을 주면 해당 성별 동물만 조회한다")
    void findWithFiltersByGender() {
        Shelter shelter = shelterRepository.findAll().get(0);
        animalRepository.save(Animal.builder()
                .shelter(shelter).species(Species.CAT).status(AnimalStatus.PROTECTED).gender(Gender.FEMALE)
                .name("암컷").build());

        Page<Animal> females = animalRepository.findWithFilters(null, null, null, Gender.FEMALE, null, null, null, null,
                PageRequest.of(0, 20, Sort.by("noticeEndDate")));

        assertThat(females.getContent()).extracting(Animal::getName).containsExactly("암컷");
    }

    @Test
    @DisplayName("보호소 id를 주면 그 보호소의 동물만 조회한다")
    void findWithFiltersByShelter() {
        Shelter shelter = shelterRepository.findAll().get(2);

        Page<Animal> page = animalRepository.findWithFilters(null, null, null, null, shelter.getId(), null, null,
                null, PageRequest.of(0, 20, Sort.by("noticeEndDate")));

        assertThat(page.getContent()).extracting(a -> a.getShelter().getId()).containsExactly(shelter.getId());
    }

    @Test
    @DisplayName("추천 목록(findRecommended)은 보호소를 함께 조회한다")
    void findRecommendedFetchesShelter() {
        Page<Animal> page = animalRepository.findRecommended(List.of(AnimalStatus.PROTECTED), null, null, null,
                null, null, PageRequest.of(0, 20, Sort.by(Sort.Direction.DESC, "createdAt")));
        assertShelterLoadedWithoutExtraQueries(page.getContent(), 2);
    }

    @Test
    @DisplayName("찜 목록(findByUser_IdOrderByCreatedAtDesc)은 동물과 보호소를 함께 조회한다")
    void favoritesFetchAnimalAndShelter() {
        User user = userRepository.save(User.builder().email("fav@example.test").password("x").name("찜").build());
        animalRepository.findAll().forEach(a -> favoriteRepository.save(Favorite.builder().user(user).animal(a).build()));
        entityManager.flush();
        entityManager.clear();
        statistics.clear();

        Page<Favorite> page = favoriteRepository.findByUser_IdOrderByCreatedAtDesc(user.getId(), PageRequest.of(0, 20));
        assertShelterLoadedWithoutExtraQueries(page.getContent().stream().map(Favorite::getAnimal).toList(), 2);
    }

    @Test
    @DisplayName("임박 목록(findUrgentAnimals)은 보호소를 함께 조회한다")
    void findUrgentFetchesShelter() {
        Page<Animal> page = animalRepository.findUrgentAnimals(AnimalStatus.PROTECTED, LocalDate.now(),
                LocalDate.now().plusYears(1), PageRequest.of(0, 20));
        assertShelterLoadedWithoutExtraQueries(page.getContent(), 2);
    }
}
