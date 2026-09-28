package com.dnproject.platform.controller;

import com.dnproject.platform.dto.request.*;
import com.dnproject.platform.dto.response.ApiResponse;
import com.dnproject.platform.dto.response.TokenResponse;
import com.dnproject.platform.dto.response.UserResponse;
import com.dnproject.platform.exception.UnauthorizedException;
import com.dnproject.platform.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Tag(name = "Auth", description = "인증 API")
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @Operation(summary = "회원가입")
    @PostMapping("/signup")
    public ApiResponse<UserResponse> signup(@Valid @RequestBody SignupRequest request) {
        UserResponse data = authService.signup(request);
        return ApiResponse.created("회원가입 성공", data);
    }

    @Operation(summary = "로그인")
    @PostMapping("/login")
    public ApiResponse<TokenResponse> login(@Valid @RequestBody LoginRequest request) {
        TokenResponse data = authService.login(request);
        return ApiResponse.success("로그인 성공", data);
    }

    @Operation(summary = "구글 인가 코드로 로그인")
    @PostMapping("/google")
    public ApiResponse<TokenResponse> googleLogin(@Valid @RequestBody GoogleLoginRequest request) {
        TokenResponse data = authService.googleLogin(request.getCode());
        return ApiResponse.success("구글 로그인 성공", data);
    }

    @Operation(summary = "카카오 인가 코드로 로그인")
    @PostMapping("/kakao")
    public ApiResponse<TokenResponse> kakaoLogin(@Valid @RequestBody KakaoLoginRequest request) {
        TokenResponse data = authService.kakaoLogin(request.getCode());
        return ApiResponse.success("카카오 로그인 성공", data);
    }

    @Operation(summary = "토큰 갱신")
    @PostMapping("/refresh")
    public ApiResponse<TokenResponse> refresh(@RequestBody RefreshRequest request) {
        TokenResponse data = authService.refreshToken(request.getRefreshToken());
        return ApiResponse.success("토큰 갱신 성공", data);
    }

    @Operation(summary = "로그아웃")
    @PostMapping("/logout")
    public ApiResponse<Void> logout() {
        return ApiResponse.success("로그아웃되었습니다.", null);
    }

    @Operation(summary = "이메일(아이디) 찾기")
    @PostMapping("/find-email")
    public ApiResponse<Map<String, String>> findEmail(@Valid @RequestBody FindEmailRequest request) {
        String maskedEmail = authService.findEmail(request.getName(), request.getPhone());
        return ApiResponse.success("이메일 찾기 성공", Map.of("maskedEmail", maskedEmail));
    }

    @Operation(summary = "비밀번호 재설정")
    @PostMapping("/reset-password")
    public ApiResponse<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request.getEmail(), request.getName(), request.getPhone(), request.getNewPassword());
        return ApiResponse.success("비밀번호가 재설정되었습니다.", null);
    }

    @Operation(summary = "내 정보 조회")
    @GetMapping("/me")
    public ApiResponse<UserResponse> getMe(HttpServletRequest httpRequest) {
        Long userId = (Long) httpRequest.getAttribute("userId");
        if (userId == null) {
            throw new UnauthorizedException("인증이 필요합니다.");
        }
        UserResponse data = authService.getMe(userId);
        return ApiResponse.success("조회 성공", data);
    }

    @Operation(summary = "내 정보 수정 (이름, 이메일). 일반/관리자/시스템 관리자 공통")
    @PatchMapping("/me")
    public ApiResponse<UserResponse> updateMe(HttpServletRequest httpRequest,
            @Valid @RequestBody UpdateMeRequest request) {
        Long userId = (Long) httpRequest.getAttribute("userId");
        if (userId == null) {
            throw new UnauthorizedException("인증이 필요합니다.");
        }
        UserResponse data = authService.updateMe(userId, request);
        return ApiResponse.success("수정되었습니다.", data);
    }

    @lombok.Data
    public static class RefreshRequest {
        private String refreshToken;
    }
}
