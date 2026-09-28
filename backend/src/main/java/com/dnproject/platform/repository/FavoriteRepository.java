package com.dnproject.platform.repository;

import com.dnproject.platform.domain.Animal;
import com.dnproject.platform.domain.Favorite;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface FavoriteRepository extends JpaRepository<Favorite, Long> {

    Optional<Favorite> findByUser_IdAndAnimal_Id(Long userId, Long animalId);

    boolean existsByUser_IdAndAnimal_Id(Long userId, Long animalId);

    /** 찜 목록 응답에 동물·보호소 정보가 필요하므로 함께 조회한다 (N+1 방지) */
    @EntityGraph(attributePaths = { "animal", "animal.shelter" })
    Page<Favorite> findByUser_IdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    @Query("SELECT f.animal.id FROM Favorite f WHERE f.user.id = :userId")
    List<Long> findAnimalIdsByUser_Id(@Param("userId") Long userId);

    @Modifying
    @Query("DELETE FROM Favorite f WHERE f.user.id = :userId AND f.animal.id = :animalId")
    void deleteByUser_IdAndAnimal_Id(@Param("userId") Long userId, @Param("animalId") Long animalId);

    @Modifying
    @Query("DELETE FROM Favorite f WHERE f.animal IN :animals")
    void deleteByAnimalIn(@Param("animals") List<Animal> animals);
}
