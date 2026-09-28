package com.dnproject.platform.repository;

import com.dnproject.platform.domain.Shelter;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ShelterRepository extends JpaRepository<Shelter, Long> {

        Optional<Shelter> findByBusinessRegistrationNumber(String businessRegistrationNumber);

        Optional<Shelter> findByPublicApiShelterId(String publicApiShelterId);

        Optional<Shelter> findByName(String name);

        /** 동일 이름 보호소 다수 시 NonUniqueResultException 방지 (공공API 동기화용) */
        Optional<Shelter> findFirstByName(String name);

        @Query("SELECT s FROM Shelter s WHERE " +
                        "(:regionSido IS NULL OR :regionSido = '' OR s.regionSido = :regionSido) AND " +
                        "(:keyword IS NULL OR :keyword = '' OR s.name LIKE %:keyword% OR s.address LIKE %:keyword%) " +
                        "ORDER BY s.id DESC")
        Page<Shelter> searchPublicShelters(
                        @Param("regionSido") String regionSido,
                        @Param("keyword") String keyword,
                        Pageable pageable);
}
