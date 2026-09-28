package com.dnproject.platform.service;

import com.dnproject.platform.domain.Board;
import com.dnproject.platform.domain.Comment;
import com.dnproject.platform.domain.User;
import com.dnproject.platform.dto.request.CommentCreateRequest;
import com.dnproject.platform.dto.response.CommentResponse;
import com.dnproject.platform.exception.CustomException;
import com.dnproject.platform.exception.NotFoundException;
import com.dnproject.platform.repository.BoardRepository;
import com.dnproject.platform.repository.CommentRepository;
import com.dnproject.platform.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final BoardRepository boardRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<CommentResponse> getComments(Long boardId) {
        if (!boardRepository.existsById(boardId)) {
            throw new NotFoundException("게시글을 찾을 수 없습니다.");
        }
        List<Comment> comments = commentRepository.findByBoard_IdOrderByCreatedAtAsc(
                boardId, PageRequest.of(0, 100)).getContent();
        return comments.stream().map(this::toCommentResponse).toList();
    }

    @Transactional
    public CommentResponse addComment(Long boardId, Long userId, CommentCreateRequest request) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new NotFoundException("게시글을 찾을 수 없습니다."));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("사용자를 찾을 수 없습니다."));

        Comment comment = Comment.builder()
                .board(board)
                .user(user)
                .content(request.getContent())
                .build();

        return toCommentResponse(commentRepository.save(comment));
    }

    @Transactional
    public CommentResponse updateComment(Long commentId, Long userId, String content) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new NotFoundException("댓글을 찾을 수 없습니다."));

        if (!comment.getUser().getId().equals(userId)) {
            throw new CustomException("본인의 댓글만 수정할 수 있습니다.", HttpStatus.FORBIDDEN, "FORBIDDEN");
        }

        comment.setContent(content);
        return toCommentResponse(comment); // Transactional will auto-save
    }

    @Transactional
    public void deleteComment(Long commentId, Long userId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new NotFoundException("댓글을 찾을 수 없습니다."));

        if (!comment.getUser().getId().equals(userId)) {
            throw new CustomException("본인의 댓글만 삭제할 수 있습니다.", HttpStatus.FORBIDDEN, "FORBIDDEN");
        }

        commentRepository.delete(comment);
    }

    private CommentResponse toCommentResponse(Comment c) {
        String userName = c.getUser() != null ? c.getUser().getName() : null;
        return CommentResponse.builder()
                .id(c.getId())
                .boardId(c.getBoard() != null ? c.getBoard().getId() : null)
                .userId(c.getUser() != null ? c.getUser().getId() : null)
                .userName(userName)
                .content(c.getContent())
                .createdAt(c.getCreatedAt())
                .build();
    }
}
