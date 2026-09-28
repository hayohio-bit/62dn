package com.dnproject.platform.domain;

import jakarta.persistence.*;
import lombok.*;

import com.dnproject.platform.domain.common.BaseTimeEntity;

@Entity
@Table(name = "comments", indexes = {
        @Index(name = "idx_comments_board", columnList = "board_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Comment extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "board_id", nullable = false)
    private Board board;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

}
