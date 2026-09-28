package com.dnproject.platform.repository;

import com.dnproject.platform.domain.AnimalImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AnimalImageRepository extends JpaRepository<AnimalImage, Long> {

    List<AnimalImage> findByAnimal_IdOrderByIsMainDesc(Long animalId);

    Optional<AnimalImage> findByAnimal_IdAndIsMainTrue(Long animalId);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("DELETE FROM AnimalImage a WHERE a.animal IN :animals")
    void deleteByAnimalIn(
            @org.springframework.data.repository.query.Param("animals") List<com.dnproject.platform.domain.Animal> animals);
}
