package com.dnproject.platform.domain;

import jakarta.persistence.*;
import lombok.*;

import com.dnproject.platform.domain.common.BaseTimeEntity;

@Entity
@Table(name = "animal_images", indexes = {
        @Index(name = "idx_animal_images_animal", columnList = "animal_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnimalImage extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "animal_id", nullable = false)
    private Animal animal;

    @Column(name = "image_url", nullable = false, length = 500)
    private String imageUrl;

    @Column(name = "is_main", nullable = false)
    @Builder.Default
    private Boolean isMain = false;

}
