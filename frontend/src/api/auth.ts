/**
 * 인증 API
 */

import axiosInstance from "@/lib/axios";
import type { ApiResponse } from "@/types/dto";
import type {
  LoginRequest,
  SignupRequest,
  TokenResponse,
  UserResponse,
  UpdateMeRequest,
  FindEmailRequest,
} from "@/types/dto";

export const authApi = {
  signup: (data: SignupRequest) =>
    axiosInstance.post<ApiResponse<UserResponse>>("/auth/signup", data),

  login: (data: LoginRequest) =>
    axiosInstance.post<ApiResponse<TokenResponse>>("/auth/login", data),

  /** 구글 인가 코드로 로그인 (백엔드에서 토큰 교환 후 JWT 발급) */
  googleLogin: (code: string) =>
    axiosInstance.post<ApiResponse<TokenResponse>>("/auth/google", { code }),

  /** 카카오 인가 코드로 로그인 (백엔드에서 토큰 교환 후 JWT 발급) */
  kakaoLogin: (code: string) =>
    axiosInstance.post<ApiResponse<TokenResponse>>("/auth/kakao", { code }),

  logout: () => axiosInstance.post<ApiResponse<null>>("/auth/logout"),

  getMe: () => axiosInstance.get<ApiResponse<UserResponse>>("/auth/me"),

  updateMe: (data: UpdateMeRequest) =>
    axiosInstance.patch<ApiResponse<UserResponse>>("/auth/me", data),

  refresh: (refreshToken: string) =>
    axiosInstance.post<ApiResponse<TokenResponse>>("/auth/refresh", {
      refreshToken,
    }),

  /** 이메일(아이디) 찾기 — 이름+전화번호로 마스킹된 이메일 반환 */
  findEmail: (data: FindEmailRequest) =>
    axiosInstance.post<ApiResponse<{ maskedEmail: string }>>(
      "/auth/find-email",
      data,
    ),
};
