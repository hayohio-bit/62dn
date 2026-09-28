package com.dnproject.platform.domain;

import com.dnproject.platform.domain.constant.Species;
import com.dnproject.platform.domain.constant.Size;
import jakarta.persistence.*;
import lombok.*;

import com.dnproject.platform.domain.common.BaseTimeEntity;

@Entity
@Table(name = "preferences")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Preference extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(length = 10)
    private Species species;

    @Column(name = "min_age")
    private Integer minAge;

    @Column(name = "max_age")
    private Integer maxAge;

    @Enumerated(EnumType.STRING)
    @Column(length = 10)
    private Size size;

    @Column(length = 50)
    private String region;

    @Column(length = 100)
    private String temperament;

}
