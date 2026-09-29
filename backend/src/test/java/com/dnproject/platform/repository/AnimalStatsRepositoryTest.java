package com.dnproject.platform.repository;

import com.dnproject.platform.domain.Animal;
import com.dnproject.platform.domain.Shelter;
import com.dnproject.platform.domain.constant.AnimalStatus;
import com.dnproject.platform.domain.constant.Species;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * 랜딩 실시간 현황 집계 쿼리를 확인한다.
 */
@DataJpaTest
@ActiveProfiles("local")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class AnimalStatsRepositoryTest {

    @Autowired
    private AnimalRepository animalRepository;
    @Autowired
    private ShelterRepository shelterRepository;

    private final LocalDate today = LocalDate.now();

    @BeforeEach
    void setUp() {
        // local 프로필의 데모 데이터와 섞이지 않도록 비우고 시작한다 (테스트 트랜잭션이 끝나면 되돌아간다)
        animalRepository.deleteAllInBatch();
        Shelter a = shelter("가 보호소");
        Shelter b = shelter("나 보호소");
        shelter("동물 없는 보호소");
        animal(a, AnimalStatus.PROTECTED, today);
        animal(a, AnimalStatus.PROTECTED, today.plusDays(7));
        animal(b, AnimalStatus.PROTECTED, today.plusDays(8));
        animal(b, AnimalStatus.FOSTERING, today.plusDays(1));
    }

    private Shelter shelter(String name) {
        return shelterRepository.save(Shelter.builder().name(name).address("서울특별시").phone("02-000-0000").build());
    }

    private void animal(Shelter shelter, AnimalStatus status, LocalDate noticeEndDate) {
        animalRepository.save(Animal.builder()
                .shelter(shelter).species(Species.DOG).status(status).noticeEndDate(noticeEndDate).build());
    }

    @Test
    @DisplayName("일주일 안 공고 마감 수는 오늘(D-Day)부터 D-7까지 보호 중인 동물만 센다")
    void countEndingWithinWeek() {
        long count = animalRepository.countByStatusAndNoticeEndDateBetween(AnimalStatus.PROTECTED, today,
                today.plusDays(7));

        assertThat(count).isEqualTo(2);
    }

    @Test
    @DisplayName("보호소 수는 보호 중인 동물이 있는 보호소만 한 번씩 센다")
    void countShelters() {
        assertThat(animalRepository.countSheltersWithStatus(AnimalStatus.PROTECTED)).isEqualTo(2);
        assertThat(animalRepository.countByStatus(AnimalStatus.PROTECTED)).isEqualTo(3);
    }
}
