package com.dnproject.platform.exception;

import com.dnproject.platform.dto.response.ErrorResponse;
import lombok.extern.slf4j.Slf4j;
import org.hibernate.query.PathException;
import org.springframework.dao.InvalidDataAccessApiUsageException;
import org.springframework.data.mapping.PropertyReferenceException;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.servlet.resource.NoResourceFoundException;
import org.springframework.web.multipart.MultipartException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.IncorrectResultSizeDataAccessException;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestControllerAdvice
// @RestControllerAdvice: 모든 컨트롤러(@RestController)에서 발생하는 예외를 한 곳에서 잡아 처리합니다.
// AOP(Aspect-Oriented Programming) 방식의 대표적인 예시입니다.
public class GlobalExceptionHandler {

    @ExceptionHandler(CustomException.class)
    public ResponseEntity<ErrorResponse> handleCustomException(CustomException ex) {
        ErrorResponse body = ErrorResponse.of(
                ex.getStatus().value(),
                ex.getErrorCode(),
                ex.getMessage());
        return ResponseEntity.status(ex.getStatus()).body(body);
    }

    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(NotFoundException ex) {
        return handleCustomException(ex);
    }

    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<ErrorResponse> handleUnauthorized(UnauthorizedException ex) {
        return handleCustomException(ex);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String[]> errors = new HashMap<>();
        for (FieldError err : ex.getBindingResult().getFieldErrors()) {
            String field = err.getField();
            String msg = err.getDefaultMessage();
            errors.put(field, new String[] { msg });
        }
        ErrorResponse body = ErrorResponse.builder()
                .status(HttpStatus.BAD_REQUEST.value())
                .error("VALIDATION_FAILED")
                .message("입력값 검증에 실패했습니다.")
                .errors(errors)
                .timestamp(Instant.now().toString())
                .build();
        return ResponseEntity.badRequest().body(body);
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ErrorResponse> handleBadCredentials(BadCredentialsException ex) {
        ErrorResponse body = ErrorResponse.of(
                HttpStatus.UNAUTHORIZED.value(),
                "UNAUTHORIZED",
                "이메일 또는 비밀번호가 올바르지 않습니다.");
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(body);
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ErrorResponse> handleAuthentication(AuthenticationException ex) {
        ErrorResponse body = ErrorResponse.of(
                HttpStatus.UNAUTHORIZED.value(),
                "UNAUTHORIZED",
                ex.getMessage());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(body);
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ErrorResponse> handleMissingParam(MissingServletRequestParameterException ex) {
        log.warn("Missing request parameter: {}", ex.getParameterName(), ex);
        ErrorResponse body = ErrorResponse.of(
                HttpStatus.BAD_REQUEST.value(),
                "MISSING_PARAMETER",
                "필수 항목이 누락되었습니다: " + ex.getParameterName());
        return ResponseEntity.badRequest().body(body);
    }

    @ExceptionHandler(MultipartException.class)
    public ResponseEntity<ErrorResponse> handleMultipart(MultipartException ex) {
        log.warn("Multipart request error (보호소 가입 등): Content-Type이 multipart/form-data인지 확인하세요", ex);
        ErrorResponse body = ErrorResponse.of(
                HttpStatus.BAD_REQUEST.value(),
                "INVALID_MULTIPART",
                "요청 형식이 올바르지 않습니다. (폼/파일 업로드 형식 확인)");
        return ResponseEntity.badRequest().body(body);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> handleDataIntegrity(DataIntegrityViolationException ex) {
        log.warn("Data integrity violation: {}", ex.getMessage());
        ErrorResponse body = ErrorResponse.of(
                HttpStatus.CONFLICT.value(),
                "DATA_CONSTRAINT",
                "데이터 저장 중 제약 조건 위반이 발생했습니다. (중복 또는 길이 초과 등)");
        return ResponseEntity.status(HttpStatus.CONFLICT).body(body);
    }

    @ExceptionHandler(IncorrectResultSizeDataAccessException.class)
    public ResponseEntity<ErrorResponse> handleIncorrectResultSize(IncorrectResultSizeDataAccessException ex) {
        log.warn("Incorrect result size (e.g. findByName 다중 결과): {}", ex.getMessage());
        ErrorResponse body = ErrorResponse.of(
                HttpStatus.CONFLICT.value(),
                "DUPLICATE_DATA",
                "중복 데이터로 인한 조회 오류가 발생했습니다.");
        return ResponseEntity.status(HttpStatus.CONFLICT).body(body);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponse> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        log.debug("Request parameter type mismatch: {}", ex.getName());
        ErrorResponse body = ErrorResponse.of(
                HttpStatus.BAD_REQUEST.value(),
                "INVALID_PARAMETER",
                "요청 값의 형식이 올바르지 않습니다: " + ex.getName());
        return ResponseEntity.badRequest().body(body);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handleNotReadable(HttpMessageNotReadableException ex) {
        log.debug("Unreadable request body: {}", ex.getMessage());
        ErrorResponse body = ErrorResponse.of(
                HttpStatus.BAD_REQUEST.value(),
                "INVALID_BODY",
                "요청 본문을 해석할 수 없습니다.");
        return ResponseEntity.badRequest().body(body);
    }

    /** 정렬 파라미터에 존재하지 않는 속성을 넣은 경우 (예: sort=foo,asc) */
    @ExceptionHandler(InvalidDataAccessApiUsageException.class)
    public ResponseEntity<ErrorResponse> handleInvalidDataAccessApiUsage(InvalidDataAccessApiUsageException ex) {
        // Hibernate는 UnknownPathException 아래에 PathElementException 등을 한 단계 더 감싸므로 원인 사슬 전체를 확인한다.
        Throwable cause = ex;
        while (cause != null && !(cause instanceof PathException || cause instanceof PropertyReferenceException)) {
            cause = cause.getCause();
        }
        if (cause != null) {
            log.debug("Invalid sort property: {}", cause.getMessage());
            ErrorResponse body = ErrorResponse.of(
                    HttpStatus.BAD_REQUEST.value(),
                    "INVALID_SORT",
                    "정렬 기준이 올바르지 않습니다.");
            return ResponseEntity.badRequest().body(body);
        }
        return handleException(ex);
    }

    /**
     * 404(없는 경로), 405(지원하지 않는 메서드), 415(지원하지 않는 Content-Type) 등 Spring MVC 표준 예외.
     * 이 핸들러가 없으면 아래 Exception 핸들러가 모두 500으로 바꾼다.
     */
    @ExceptionHandler({ NoResourceFoundException.class, HttpRequestMethodNotSupportedException.class,
            HttpMediaTypeNotSupportedException.class })
    public ResponseEntity<ErrorResponse> handleSpringErrorResponse(Exception ex) {
        HttpStatusCode status = ((org.springframework.web.ErrorResponse) ex).getStatusCode();
        HttpStatus resolved = HttpStatus.resolve(status.value());
        log.debug("Spring MVC error {}: {}", status.value(), ex.getMessage());
        ErrorResponse body = ErrorResponse.of(
                status.value(),
                resolved != null ? resolved.name() : "ERROR",
                resolved != null ? resolved.getReasonPhrase() : "요청을 처리할 수 없습니다.");
        return ResponseEntity.status(status).body(body);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleException(Exception ex) {
        log.error("Unhandled exception", ex);
        ErrorResponse body = ErrorResponse.of(
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                "INTERNAL_ERROR",
                "서버 오류가 발생했습니다.");
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
    }
}
