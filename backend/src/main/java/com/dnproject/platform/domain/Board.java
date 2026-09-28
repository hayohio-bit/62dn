package com.dnproject.platform.domain;

import com.dnproject.platform.domain.constant.BoardType;
import jakarta.persistence.*;
import lombok.*;

import com.dnproject.platform.domain.common.BaseTimeEntity;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "boards", indexes = {
        @Index(name = "idx_boards_type", columnList = "type"),
        @Index(name = "idx_boards_created", columnList = "created_at"),
        @Index(name = "idx_boards_shelter", columnList = "shelter_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Board extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shelter_id")
    private Shelter shelter;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private BoardType type;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(nullable = false)
    @Builder.Default
    private Integer views = 0;

    @Column(name = "is_pinned", nullable = false)
    @Builder.Default
    private Boolean isPinned = false;

    @OneToMany(mappedBy = "board", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Comment> comments = new ArrayList<>();

}
