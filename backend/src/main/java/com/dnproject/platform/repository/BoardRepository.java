package com.dnproject.platform.repository;

import com.dnproject.platform.domain.Board;
import com.dnproject.platform.domain.constant.BoardType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BoardRepository extends JpaRepository<Board, Long> {

        @org.springframework.data.jpa.repository.Query("SELECT b FROM Board b WHERE " +
                        "(:type IS NULL OR b.type = :type) AND " +
                        "(:keyword IS NULL OR :keyword = '' OR " +
                        "LOWER(b.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
                        "LOWER(b.content) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
                        "LOWER(b.user.name) LIKE LOWER(CONCAT('%', :keyword, '%')))")
        Page<Board> findWithSearch(
                        @org.springframework.data.repository.query.Param("type") BoardType type,
                        @org.springframework.data.repository.query.Param("keyword") String keyword,
                        Pageable pageable);

        // Page<Board> findByTypeOrderByIsPinnedDescCreatedAtDesc(BoardType type,
        // Pageable pageable); // Deprecated by findWithSearch
        // Page<Board> findAllByOrderByIsPinnedDescCreatedAtDesc(Pageable pageable); //
        // Deprecated by findWithSearch

        Page<Board> findByShelter_IdAndType(Long shelterId, BoardType type, Pageable pageable);

        /**
         * 조회수를 DB에서 1 올린다. 엔티티를 고쳐 저장하면 수정 시각(updatedAt)까지 바뀌어
         * 조회만 한 글이 "수정됨"으로 보이므로, 감사(auditing)를 거치지 않는 벌크 UPDATE를 쓴다.
         */
        @Modifying(clearAutomatically = true)
        @Query("UPDATE Board b SET b.views = b.views + 1 WHERE b.id = :id")
        int increaseViews(@Param("id") Long id);

        /** 고정 여부만 바꾼다. 글 내용 수정이 아니므로 수정 시각을 바꾸지 않는다. */
        @Modifying(clearAutomatically = true)
        @Query("UPDATE Board b SET b.isPinned = :pinned WHERE b.id = :id")
        int updatePinned(@Param("id") Long id, @Param("pinned") boolean pinned);
}
