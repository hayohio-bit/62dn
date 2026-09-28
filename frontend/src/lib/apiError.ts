import axios from "axios";

/** 백엔드 오류 응답 본문 (ApiResponse/ErrorResponse 공통 필드) */
type ApiErrorBody = { message?: string };

/** axios 오류 응답의 서버 메시지를 반환하고, 없으면 fallback을 반환한다. */
export function getApiErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError<ApiErrorBody>(err)) {
    const message = err.response?.data?.message;
    if (message) return message;
  }
  return fallback;
}
