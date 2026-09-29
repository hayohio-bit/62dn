package com.dnproject.platform.repository;

import com.dnproject.platform.domain.Animal;
import com.dnproject.platform.domain.constant.AnimalStatus;
import com.dnproject.platform.domain.constant.Gender;
import com.dnproject.platform.domain.constant.Size;
import com.dnproject.platform.domain.constant.Species;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface AnimalRepository extends JpaRepository<Animal, Long> {

        Page<Animal> findByShelter_Id(Long shelterId, Pageable pageable);

        Page<Animal> findBySpecies(Species species, Pageable pageable);

        Page<Animal> findByStatus(AnimalStatus status, Pageable pageable);

        Optional<Animal> findByPublicApiAnimalId(String publicApiAnimalId);

        /**
         * region/sigungu는 Shelter.regionSido, regionSigungu 기준 정확 매칭. search는
         * 이름·품종·보호소명 LIKE
         */
        @EntityGraph(attributePaths = "shelter")
        @Query("SELECT a FROM Animal a JOIN a.shelter s WHERE " +
                        "(:species IS NULL OR a.species = :species) " +
                        "AND (:status IS NULL OR a.status = :status) AND (:size IS NULL OR a.size = :size) " +
                        "AND (:gender IS NULL OR a.gender = :gender) " +
                        "AND (:shelterId IS NULL OR s.id = :shelterId) " +
                        "AND (:region IS NULL OR :region = '' OR s.regionSido = :region) " +
                        "AND (:sigungu IS NULL OR :sigungu = '' OR s.regionSigungu = :sigungu) " +
                        "AND (:search IS NULL OR :search = '' OR LOWER(a.name) LIKE LOWER(CONCAT('%', :search, '%')) " +
                        "OR LOWER(a.breed) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(s.name) LIKE LOWER(CONCAT('%', :search, '%')))")
        Page<Animal> findWithFilters(@Param("species") Species species, @Param("status") AnimalStatus status,
                        @Param("size") Size size, @Param("gender") Gender gender, @Param("shelterId") Long shelterId,
                        @Param("region") String region,
                        @Param("sigungu") String sigungu, @Param("search") String search, Pageable pageable);

        /** 공공API 유래, 보호중, 등록일이 N일 초과된 동물 (상태 보정 대상) */
        @Query("SELECT a FROM Animal a WHERE a.publicApiAnimalId IS NOT NULL AND a.publicApiAnimalId != '' " +
                        "AND a.status = :status AND a.registerDate < :cutoff")
        List<Animal> findExpiredFromPublicApi(@Param("status") AnimalStatus status, @Param("cutoff") LocalDate cutoff);

        /** 특정 상태 동물 일괄 삭제 */
        void deleteAllByStatus(AnimalStatus status);

        /** 특정 상태 동물 전체 조회 */
        List<Animal> findAllByStatus(AnimalStatus status);

        /** status가 NULL인 동물 삭제 */
        @Query("SELECT a FROM Animal a WHERE a.status IS NULL")
        List<Animal> findAllByStatusIsNull();

        /** ADOPTED 건수 조회 */
        long countByStatus(AnimalStatus status);

        /** 선호도 기반: 종류·나이 범위·크기·지역(복수)으로 필터링 (입양 가능한 상태만) */
        @EntityGraph(attributePaths = "shelter")
        @Query("SELECT a FROM Animal a JOIN a.shelter s WHERE a.imageUrl IS NOT NULL AND a.imageUrl != '' " +
                        "AND a.status IN :statuses " +
                        "AND (:species IS NULL OR a.species = :species) " +
                        "AND (:minAge IS NULL OR a.age >= :minAge) AND (:maxAge IS NULL OR a.age <= :maxAge) " +
                        "AND (:size IS NULL OR a.size = :size) " +
                        "AND (:regions IS NULL OR s.regionSido IN (:regions))")
        Page<Animal> findRecommended(@Param("statuses") List<AnimalStatus> statuses,
                        @Param("species") Species species,
                        @Param("minAge") Integer minAge, @Param("maxAge") Integer maxAge,
                        @Param("size") Size size, @Param("regions") List<String> regions, Pageable pageable);

        /** 안락사 D-Day: 마감이 임박한 보호중 동물 (오늘 ~ maxDate) */
        @EntityGraph(attributePaths = "shelter")
        @Query("SELECT a FROM Animal a JOIN a.shelter s WHERE a.imageUrl IS NOT NULL AND a.imageUrl != '' " +
                        "AND a.status = :status AND a.noticeEndDate >= :today AND a.noticeEndDate <= :maxDate " +
                        "ORDER BY a.noticeEndDate ASC")
        Page<Animal> findUrgentAnimals(@Param("status") AnimalStatus status, @Param("today") LocalDate today,
                        @Param("maxDate") LocalDate maxDate, Pageable pageable);

        /** 만료 보정: 공고 종료일이 지난 보호중 동물 */
        List<Animal> findAllByStatusAndNoticeEndDateBefore(AnimalStatus status, LocalDate date);
}
