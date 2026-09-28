/**
 * Axios 인스턴스 설정
 * 스프링 부트 백엔드 API 통신용
 */

import axios from "axios";
import {
  getAccessToken,
  getRefreshToken,
  useAuthStore,
} from "@/store/authStore";

// 개발 시 미설정이면 상대 경로 /api 사용 → Vite 프록시(localhost:8080)로 전달됨. 백엔드 동시 실행 필요.
const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  (import.meta.env.DEV ? "/api" : "http://localhost:8080/api");

export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: JWT 토큰 자동 추가 (localStorage 또는 sessionStorage)
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// 토큰 없이 호출하는 인증 API. 이 요청의 401은 "토큰 만료"가 아니라 "인증 실패"(잘못된 비밀번호, 소셜 인가 코드 오류 등)이므로
// 토큰 갱신·강제 로그아웃 대상에서 제외한다. (카카오 로그인 실패 시 갱신 후 같은 인가 코드로 재시도하던 문제 방지)
const PUBLIC_AUTH_PATH =
  /\/auth\/(login|signup|google|kakao|refresh|find-email)(\?|$)/;

// Response Interceptor: 에러 처리 및 토큰 갱신
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    // 요청 설정이 없는 오류(요청 생성 단계 실패 등)는 재시도할 수 없으므로 그대로 전달
    if (!originalRequest) return Promise.reject(error);

    // 401 Unauthorized: 토큰 만료 (단, 인증 API 자체의 실패는 제외해서 무한루프 및 에러 왜곡 방지)
    const isAuthRequest = PUBLIC_AUTH_PATH.test(originalRequest.url ?? "");

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthRequest
    ) {
      originalRequest._retry = true;

      const refreshToken = getRefreshToken();
      if (refreshToken) {
        try {
          // 토큰 갱신 요청
          const response = await axios.post(`${BASE_URL}/auth/refresh`, {
            refreshToken,
          });

          const payload = response.data?.data ?? response.data;
          const accessToken = payload?.accessToken;
          const newRefreshToken = payload?.refreshToken;
          // 새 액세스 토큰이 없으면 "Bearer undefined"로 재시도하지 않고 갱신 실패로 처리
          if (!accessToken) throw new Error("토큰 갱신 응답에 accessToken이 없습니다.");
          const storage = localStorage.getItem("refreshToken")
            ? localStorage
            : sessionStorage;
          if (accessToken) storage.setItem("accessToken", accessToken);
          if (newRefreshToken) storage.setItem("refreshToken", newRefreshToken);

          if (accessToken && payload.user) {
            useAuthStore.getState().login(
              {
                accessToken,
                refreshToken: newRefreshToken ?? refreshToken,
                expiresIn: payload.expiresIn ?? 86400,
                user: payload.user,
              },
              { keepLoggedIn: !!localStorage.getItem("refreshToken") },
            );
          }

          // 원래 요청 재시도
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return axiosInstance(originalRequest);
        } catch (refreshError) {
          // 리프레시 실패 시 로그아웃
          useAuthStore.getState().logout();
          window.location.href = "/login";
        }
      } else {
        // 리프레시 토큰 없으면 로그아웃
        useAuthStore.getState().logout();
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;
