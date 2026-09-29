package com.dnproject.platform.repository;

import com.dnproject.platform.domain.Board;
import com.dnproject.platform.domain.User;
import com.dnproject.platform.domain.constant.BoardType;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;

/**
 * 게시글의 수정 시각(updatedAt)은 글 내용을 고쳤을 때만 바뀌어야 한다.
 * 화면은 createdAt과 updatedAt이 다르면 "수정됨"을 표시한다.
 */
@DataJpaTest
@ActiveProfiles("local")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class BoardRepositoryTest {

    @Autowired
    private BoardRepository boardRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private EntityManager entityManager;

    private Long boardId;
    private Instant savedUpdatedAt;

    @BeforeEach
    void setUp() {
        User user = userRepository.save(User.builder().email("writer@example.test").password("x").name("작성자").build());
        Board board = boardRepository.saveAndFlush(Board.builder()
                .user(user).type(BoardType.FREE).title("제목").content("내용").views(0).isPinned(false).build());
        boardId = board.getId();
        savedUpdatedAt = board.getUpdatedAt();
        entityManager.clear();
    }

    @Test
    @DisplayName("조회수를 올려도 수정 시각은 바뀌지 않는다")
    void increaseViewsKeepsUpdatedAt() throws InterruptedException {
        Thread.sleep(20);

        boardRepository.increaseViews(boardId);
        boardRepository.increaseViews(boardId);

        Board reloaded = boardRepository.findById(boardId).orElseThrow();
        assertThat(reloaded.getViews()).isEqualTo(2);
        // DB는 마이크로초까지 저장하므로 1ms 오차 안에서 비교한다 (실제로 바뀌면 20ms 이상 차이 난다)
        assertThat(reloaded.getUpdatedAt()).isCloseTo(savedUpdatedAt, within(1, ChronoUnit.MILLIS));
    }

    @Test
    @DisplayName("고정 여부를 바꿔도 수정 시각은 바뀌지 않는다")
    void updatePinnedKeepsUpdatedAt() throws InterruptedException {
        Thread.sleep(20);

        int updated = boardRepository.updatePinned(boardId, true);

        Board reloaded = boardRepository.findById(boardId).orElseThrow();
        assertThat(updated).isEqualTo(1);
        assertThat(reloaded.getIsPinned()).isTrue();
        // DB는 마이크로초까지 저장하므로 1ms 오차 안에서 비교한다 (실제로 바뀌면 20ms 이상 차이 난다)
        assertThat(reloaded.getUpdatedAt()).isCloseTo(savedUpdatedAt, within(1, ChronoUnit.MILLIS));
    }

    @Test
    @DisplayName("제목을 고치면 수정 시각이 바뀐다")
    void editChangesUpdatedAt() throws InterruptedException {
        Thread.sleep(20);
        Board board = boardRepository.findById(boardId).orElseThrow();

        board.setTitle("고친 제목");
        boardRepository.saveAndFlush(board);

        assertThat(board.getUpdatedAt()).isAfter(savedUpdatedAt);
    }

    @Test
    @DisplayName("없는 게시글의 고정 여부를 바꾸면 0건이 바뀐다")
    void updatePinnedMissing() {
        assertThat(boardRepository.updatePinned(boardId + 999, true)).isZero();
    }
}
