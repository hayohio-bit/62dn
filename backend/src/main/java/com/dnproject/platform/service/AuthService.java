package com.dnproject.platform.service;

import com.dnproject.platform.domain.User;
import com.dnproject.platform.domain.constant.Role;
import com.dnproject.platform.dto.request.LoginRequest;
import com.dnproject.platform.dto.request.SignupRequest;
import com.dnproject.platform.dto.request.UpdateMeRequest;
import com.dnproject.platform.dto.response.TokenResponse;
import com.dnproject.platform.dto.response.UserResponse;
import com.dnproject.platform.exception.CustomException;
import com.dnproject.platform.exception.UnauthorizedException;
import com.dnproject.platform.repository.UserRepository;
import com.dnproject.platform.security.JwtProvider;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.util.Collections;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private static final String GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
    private static final String GOOGLE_USER_INFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";
    private static final String KAKAO_TOKEN_URL = "https://kauth.kakao.com/oauth/token";
    private static final String KAKAO_USER_INFO_URL = "https://kapi.kakao.com/v2/user/me";

    @org.springframework.beans.factory.annotation.Value("${KAKAO_CLIENT_ID:}")
    private String kakaoClientId;

    @org.springframework.beans.factory.annotation.Value("${KAKAO_CLIENT_SECRET:}")
    private String kakaoClientSecret;

    @org.springframework.beans.factory.annotation.Value("${KAKAO_REDIRECT_URI:}")
    private String kakaoRedirectUri;

    @org.springframework.beans.factory.annotation.Value("${GOOGLE_CLIENT_ID:}")
    private String googleClientId;

    @org.springframework.beans.factory.annotation.Value("${GOOGLE_CLIENT_SECRET:}")
    private String googleClientSecret;

    @org.springframework.beans.factory.annotation.Value("${GOOGLE_REDIRECT_URI:}")
    private String googleRedirectUri;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;
    private final WebClient.Builder webClientBuilder;

    /**
     * 카카오 인가 코드로 로그인을 처리합니다.
     */
    @Transactional
    public TokenResponse kakaoLogin(String code) {
        if (code == null || code.isBlank()) {
            throw new UnauthorizedException("카카오 인가 코드가 없습니다.");
        }

        // 1. Authorization Code로 Access Token 받기
        Map<String, Object> tokenResponse;
        try {
            var bodyBuilder = org.springframework.web.reactive.function.BodyInserters
                    .fromFormData("grant_type", "authorization_code")
                    .with("client_id", kakaoClientId)
                    .with("redirect_uri", kakaoRedirectUri)
                    .with("code", code);

            if (kakaoClientSecret != null && !kakaoClientSecret.isBlank()) {
                bodyBuilder.with("client_secret", kakaoClientSecret);
            }

            tokenResponse = webClientBuilder.build()
                    .post()
                    .uri(KAKAO_TOKEN_URL)
                    .contentType(org.springframework.http.MediaType.APPLICATION_FORM_URLENCODED)
                    .body(bodyBuilder)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();
        } catch (WebClientResponseException e) {
            log.error("Kakao token exchange failed: status={} body={}", e.getStatusCode(),
                    e.getResponseBodyAsString());
            throw new UnauthorizedException("카카오 토큰 발급에 실패했습니다.");
        } catch (Exception e) {
            log.error("Kakao token exchange unexpected error", e);
            throw new CustomException("카카오 토큰 발급 중 예상치 못한 오류가 발생했습니다.", HttpStatus.INTERNAL_SERVER_ERROR,
                    "KAKAO_TOKEN_ERROR");
        }

        if (tokenResponse == null || !tokenResponse.containsKey("access_token")) {
            log.error("Kakao token response is empty or missing access_token: {}", tokenResponse);
            throw new UnauthorizedException("카카오 토큰 발급에 실패했습니다.");
        }

        String kakaoAccessToken = tokenResponse.get("access_token").toString();

        // 2. Access Token으로 사용자 정보 가져오기
        Map<String, Object> userInfo;
        try {
            userInfo = webClientBuilder.build()
                    .get()
                    .uri(KAKAO_USER_INFO_URL)
                    .header(org.springframework.http.HttpHeaders.AUTHORIZATION, "Bearer " + kakaoAccessToken)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();
        } catch (WebClientResponseException e) {
            log.error("Kakao user info retrieval failed: status={} body={}", e.getStatusCode(),
                    e.getResponseBodyAsString());
            throw new UnauthorizedException("카카오 사용자 정보 조회에 실패했습니다.");
        } catch (Exception e) {
            log.error("Kakao user info retrieval unexpected error", e);
            throw new CustomException("카카오 사용자 정보 조회 중 예상치 못한 오류가 발생했습니다.", HttpStatus.INTERNAL_SERVER_ERROR,
                    "KAKAO_USER_INFO_ERROR");
        }

        if (userInfo == null) {
            log.error("Kakao user info response is null");
            throw new UnauthorizedException("카카오 사용자 정보 조회에 실패했습니다.");
        }

        // 3. 사용자 정보 추출
        Map<String, Object> kakaoAccount = (Map<String, Object>) userInfo.get("kakao_account");
        Map<String, Object> profile = kakaoAccount != null ? (Map<String, Object>) kakaoAccount.get("profile")
                : Collections.emptyMap();

        String kakaoEmail = kakaoAccount != null
                ? Optional.ofNullable(kakaoAccount.get("email")).map(Object::toString).map(String::trim).orElse(null)
                : null;
        String email = (kakaoEmail == null || kakaoEmail.isEmpty())
                ? "kakao_" + userInfo.get("id").toString() + "@kakao.com"
                : kakaoEmail;

        String nickname = profile != null
                ? Optional.ofNullable(profile.get("nickname")).map(Object::toString).map(String::trim).orElse("카카오사용자")
                : "카카오사용자";

        // 4. DB 사용자 조회/생성
        User user = userRepository.findByEmailTrimmed(email)
                .orElseGet(() -> createGoogleUser(email, nickname)); // 구글 사용자 생성 로직 재활용 (이름만 다름)

        // 5. JWT 발급
        String accessToken = jwtProvider.createAccessToken(user.getEmail(), user.getRole().name(), user.getId());
        String refreshToken = jwtProvider.createRefreshToken(user.getEmail());

        return TokenResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtProvider.getAccessValiditySeconds())
                .user(toUserResponse(user))
                .build();
    }

    @Transactional
    public UserResponse signup(SignupRequest request) {
        String email = request.getEmail() != null ? request.getEmail().trim() : "";
        String rawPassword = request.getPassword() != null ? request.getPassword().trim() : "";
        if (userRepository.existsByEmailTrimmed(email)) {
            throw new CustomException("이미 사용 중인 이메일입니다.", HttpStatus.CONFLICT, "EMAIL_EXISTS");
        }
        String encodedPassword = passwordEncoder.encode(rawPassword);
        User user = User.builder()
                .email(email)
                .password(encodedPassword)
                .name(request.getName())
                .phone(request.getPhone())
                .address(request.getAddress())
                .build();
        user = userRepository.save(user);
        userRepository.flush();
        User refetched = userRepository.findById(user.getId()).orElse(null);
        if (refetched != null && !passwordEncoder.matches(rawPassword, refetched.getPassword())) {
            log.error("회원가입 직후 비밀번호 검증 실패: DB 저장값과 불일치. id={} encodedLen={} refetchedLen={}",
                    user.getId(), encodedPassword.length(),
                    refetched.getPassword() != null ? refetched.getPassword().length() : 0);
            throw new CustomException("비밀번호 저장에 실패했습니다. 다시 시도해 주세요.", HttpStatus.INTERNAL_SERVER_ERROR,
                    "PASSWORD_SAVE_FAILED");
        }
        return toUserResponse(user);
    }

    /**
     * 구글 인가 코드로 로그인을 처리합니다. (카카오 로그인과 동일한 패턴)
     */
    @Transactional
    public TokenResponse googleLogin(String code) {
        if (code == null || code.isBlank()) {
            throw new UnauthorizedException("구글 인가 코드가 없습니다.");
        }

        // 1. Authorization Code → Access Token 교환
        Map<String, Object> tokenResponse;
        try {
            var bodyBuilder = org.springframework.web.reactive.function.BodyInserters
                    .fromFormData("grant_type", "authorization_code")
                    .with("client_id", googleClientId)
                    .with("client_secret", googleClientSecret)
                    .with("redirect_uri", googleRedirectUri)
                    .with("code", code);

            tokenResponse = webClientBuilder.build()
                    .post()
                    .uri(GOOGLE_TOKEN_URL)
                    .contentType(org.springframework.http.MediaType.APPLICATION_FORM_URLENCODED)
                    .body(bodyBuilder)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();
        } catch (WebClientResponseException e) {
            log.error("Google token exchange failed: status={} body={}", e.getStatusCode(),
                    e.getResponseBodyAsString());
            throw new UnauthorizedException("구글 토큰 발급에 실패했습니다.");
        } catch (Exception e) {
            log.error("Google token exchange unexpected error", e);
            throw new CustomException("구글 토큰 발급 중 예상치 못한 오류가 발생했습니다.", HttpStatus.INTERNAL_SERVER_ERROR,
                    "GOOGLE_TOKEN_ERROR");
        }

        if (tokenResponse == null || !tokenResponse.containsKey("access_token")) {
            log.error("Google token response is empty or missing access_token: {}", tokenResponse);
            throw new UnauthorizedException("구글 토큰 발급에 실패했습니다.");
        }

        String googleAccessToken = tokenResponse.get("access_token").toString();

        // 2. Access Token → 사용자 정보 조회
        Map<String, Object> userInfo;
        try {
            userInfo = webClientBuilder.build()
                    .get()
                    .uri(GOOGLE_USER_INFO_URL)
                    .header(org.springframework.http.HttpHeaders.AUTHORIZATION, "Bearer " + googleAccessToken)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();
        } catch (WebClientResponseException e) {
            log.error("Google user info retrieval failed: status={} body={}", e.getStatusCode(),
                    e.getResponseBodyAsString());
            throw new UnauthorizedException("구글 사용자 정보 조회에 실패했습니다.");
        } catch (Exception e) {
            log.error("Google user info retrieval unexpected error", e);
            throw new CustomException("구글 사용자 정보 조회 중 예상치 못한 오류가 발생했습니다.", HttpStatus.INTERNAL_SERVER_ERROR,
                    "GOOGLE_USER_INFO_ERROR");
        }

        if (userInfo == null) {
            log.error("Google user info response is null");
            throw new UnauthorizedException("구글 사용자 정보 조회에 실패했습니다.");
        }

        // 3. 사용자 정보 추출
        String email = Optional.ofNullable(userInfo.get("email")).map(Object::toString).map(String::trim).orElse(null);
        if (email == null || email.isEmpty()) {
            log.warn("구글 사용자 정보에 email 없음: {}", userInfo.keySet());
            throw new UnauthorizedException("구글 계정 정보를 확인할 수 없습니다.");
        }
        String name = Optional.ofNullable(userInfo.get("name")).map(Object::toString).map(String::trim).orElse(null);
        final String displayName = (name == null || name.isBlank())
                ? Optional.ofNullable(userInfo.get("given_name")).map(Object::toString).map(String::trim).orElse(email)
                : name;

        // 4. DB 사용자 조회/생성
        User user = userRepository.findByEmailTrimmed(email)
                .orElseGet(() -> createGoogleUser(email, displayName));

        // 5. JWT 발급
        String accessToken = jwtProvider.createAccessToken(user.getEmail(), user.getRole().name(), user.getId());
        String refreshToken = jwtProvider.createRefreshToken(user.getEmail());
        return TokenResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtProvider.getAccessValiditySeconds())
                .user(toUserResponse(user))
                .build();
    }

    @Transactional
    protected User createGoogleUser(String email, String name) {
        String randomPassword = passwordEncoder.encode(UUID.randomUUID().toString());
        User user = User.builder()
                .email(email)
                .password(randomPassword)
                .name(name != null && !name.isBlank() ? name : email)
                .role(Role.USER)
                .build();
        return userRepository.save(user);
    }

    public TokenResponse login(LoginRequest request) {
        String email = request.getEmail() != null ? request.getEmail().trim() : "";
        String rawPassword = request.getPassword() != null ? request.getPassword().trim() : "";
        log.debug("로그인 시도 email={} rawPasswordLen={}", email, rawPassword != null ? rawPassword.length() : 0);

        // 1. 이메일로 사용자 조회
        User user = userRepository.findByEmailTrimmed(email)
                .orElseThrow(() -> {
                    log.warn("로그인 실패: 이메일 없음 email={}", email);
                    return new UnauthorizedException("이메일 또는 비밀번호가 올바르지 않습니다.");
                });

        // 2. 비밀번호 검증 (BCryptPasswordEncoder 사용)
        // - 입력받은 비밀번호(raw)와 DB에 저장된 해시값(stored)을 비교합니다.
        String storedPassword = user.getPassword();
        if (storedPassword == null || !passwordEncoder.matches(rawPassword, storedPassword)) {
            log.warn("로그인 실패: 비밀번호 불일치 email={} storedHashLength={}",
                    email, storedPassword != null ? storedPassword.length() : 0);
            throw new UnauthorizedException("이메일 또는 비밀번호가 올바르지 않습니다.");
        }

        // 3. 인증 성공 시 토큰 발급 (Access Token + Refresh Token)
        String accessToken = jwtProvider.createAccessToken(user.getEmail(), user.getRole().name(), user.getId());
        String refreshToken = jwtProvider.createRefreshToken(user.getEmail());

        UserResponse userResponse = toUserResponse(user);

        // 4. 응답 DTO 생성 및 반환
        return TokenResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtProvider.getAccessValiditySeconds())
                .user(userResponse)
                .build();
    }

    public TokenResponse refreshToken(String refreshToken) {
        if (refreshToken == null || !jwtProvider.validateRefreshToken(refreshToken)) {
            throw new UnauthorizedException("유효하지 않은 갱신 토큰입니다.");
        }
        Claims claims = jwtProvider.parseRefreshToken(refreshToken);
        String email = claims.getSubject();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UnauthorizedException("사용자를 찾을 수 없습니다."));
        String newAccessToken = jwtProvider.createAccessToken(user.getEmail(), user.getRole().name(), user.getId());
        String newRefreshToken = jwtProvider.createRefreshToken(user.getEmail());
        return TokenResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtProvider.getAccessValiditySeconds())
                .user(toUserResponse(user))
                .build();
    }

    @Transactional(readOnly = true)
    public UserResponse getMe(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UnauthorizedException("사용자를 찾을 수 없습니다."));
        return toUserResponse(user);
    }

    @Transactional
    public UserResponse updateMe(Long userId, UpdateMeRequest request) {
        if (request == null) {
            throw new CustomException("수정할 항목을 입력해 주세요.", HttpStatus.BAD_REQUEST, "INVALID_REQUEST");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UnauthorizedException("사용자를 찾을 수 없습니다."));
        boolean changed = false;
        if (request.getName() != null && !request.getName().isBlank()) {
            String name = request.getName().trim();
            if (!name.equals(user.getName())) {
                user.setName(name);
                changed = true;
            }
        }
        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            String email = request.getEmail().trim();
            if (!email.equals(user.getEmail())) {
                userRepository.findByEmailTrimmed(email).ifPresent(other -> {
                    if (!other.getId().equals(userId)) {
                        throw new CustomException("이미 사용 중인 이메일입니다.", HttpStatus.CONFLICT, "EMAIL_EXISTS");
                    }
                });
                user.setEmail(email);
                changed = true;
            }
        }
        if (!changed) {
            return toUserResponse(user);
        }
        User saved = userRepository.save(user);
        return toUserResponse(saved);
    }

    public UserResponse toUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .role(user.getRole())
                .createdAt(user.getCreatedAt())
                .build();
    }

    /**
     * 이름 + 전화번호로 이메일 찾기 (마스킹 처리)
     */
    @Transactional(readOnly = true)
    public String findEmail(String name, String phone) {
        String trimmedName = name != null ? name.trim() : "";
        String trimmedPhone = phone != null ? phone.trim() : "";

        User user = userRepository.findByNameAndPhone(trimmedName, trimmedPhone)
                .orElseThrow(() -> new CustomException(
                        "일치하는 회원 정보를 찾을 수 없습니다.", HttpStatus.NOT_FOUND, "USER_NOT_FOUND"));

        return maskEmail(user.getEmail());
    }

    /**
     * 이메일 + 이름 + 전화번호 확인 후 비밀번호 재설정
     */
    @Transactional
    public void resetPassword(String email, String name, String phone, String newPassword) {
        String trimmedEmail = email != null ? email.trim() : "";
        String trimmedName = name != null ? name.trim() : "";
        String trimmedPhone = phone != null ? phone.trim() : "";

        User user = userRepository.findByEmailTrimmed(trimmedEmail)
                .orElseThrow(() -> new CustomException(
                        "일치하는 회원 정보를 찾을 수 없습니다.", HttpStatus.NOT_FOUND, "USER_NOT_FOUND"));

        if (!trimmedName.equals(user.getName()) ||
                user.getPhone() == null || !trimmedPhone.equals(user.getPhone())) {
            throw new CustomException(
                    "이름 또는 전화번호가 일치하지 않습니다.", HttpStatus.BAD_REQUEST, "INFO_MISMATCH");
        }

        user.setPassword(passwordEncoder.encode(newPassword.trim()));
        userRepository.save(user);
    }

    /**
     * 이메일 마스킹 (예: test@example.com → te**@example.com)
     */
    private String maskEmail(String email) {
        if (email == null || !email.contains("@"))
            return "***";
        String[] parts = email.split("@");
        String local = parts[0];
        String domain = parts[1];
        if (local.length() <= 2) {
            return local.charAt(0) + "**@" + domain;
        }
        return local.substring(0, 2) + "*".repeat(local.length() - 2) + "@" + domain;
    }
}
