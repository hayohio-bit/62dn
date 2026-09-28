package com.dnproject.platform.exception;

/**
 * 공공데이터 API 호출 실패.
 * 메시지에는 서비스 키가 들어가지 않도록 호출 측에서 정제한 문자열만 담는다.
 * 원본 예외(WebClient 예외 등)는 요청 URL과 serviceKey를 메시지에 포함하므로 cause로 연결하지 않는다.
 */
public class PublicApiException extends RuntimeException {

    public PublicApiException(String message) {
        super(message, null, false, false);
    }
}
