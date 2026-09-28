/**
 * 시스템 관리자 전용 - 회원 목록, 게시판 관리 등
 */

import axiosInstance from "@/lib/axios";
import type { ApiResponse } from "@/types/dto";
import type { UserResponse } from "@/types/dto";
import type { BoardResponse } from "@/types/dto";
import type { PageResponse } from "@/types/dto";

export type RoleFilter = "USER" | "SUPER_ADMIN";

export const adminApi = {
  /** 회원 목록 (페이지, 역할 필터) - role 빈 문자열이면 서버에 보내지 않음 */
  getUsers: (page = 0, size = 20, role?: RoleFilter) =>
    axiosInstance.get<ApiResponse<PageResponse<UserResponse>>>("/admin/users", {
      params: { page, size, ...(role ? { role } : {}) },
    }),

  /** 회원 강제 탈퇴 (슈퍼관리자) */
  deleteUser: (userId: number) =>
    axiosInstance.delete<ApiResponse<null>>(`/admin/users/${userId}`),

  /** 게시판 목록 (관리자) - type 빈 문자열이면 서버에 보내지 않음 */
  getBoards: (page = 0, size = 20, type?: string) =>
    axiosInstance.get<ApiResponse<PageResponse<BoardResponse>>>(
      "/admin/boards",
      {
        params: { page, size, ...(type ? { type } : {}) },
      },
    ),

  /** 게시글 상단 고정/해제 */
  setBoardPinned: (boardId: number, pinned: boolean) =>
    axiosInstance.put<ApiResponse<BoardResponse>>(
      `/admin/boards/${boardId}/pin`,
      { pinned },
    ),

  /** 게시글 삭제 (관리자) */
  deleteBoard: (boardId: number) =>
    axiosInstance.delete<ApiResponse<null>>(`/admin/boards/${boardId}`),

  /** 공공데이터 유기동물 동기화 (장시간 소요 → 타임아웃 3분) */
  syncFromPublicApi: (params?: {
    days?: number;
    maxPages?: number;
    species?: string;
  }) =>
    axiosInstance.post<
      ApiResponse<{
        addedCount: number;
        updatedCount: number;
        syncedCount: number;
        removedCount: number;
        days: number;
        species: string;
        apiKeyConfigured?: boolean;
        /** 일부 공공 API 호출이 실패하면 false */
        success?: boolean;
        failedRequestCount?: number;
        errorMessage?: string;
      }>
    >("/admin/animals/sync-from-public-api", null, {
      params,
      timeout: 180_000,
    }),

  /** 동기화 이력 목록 (자동/수동, 추가·수정·삭제·보정) */
  getSyncHistory: (page = 0, size = 20) =>
    axiosInstance.get<ApiResponse<PageResponse<SyncHistoryItem>>>(
      "/admin/animals/sync-history",
      {
        params: { page, size },
      },
    ),

  /** 동기화 실행 후 비보호 동물 일괄 정리 (입양·반환·안락사 등) */
  cleanupInvalidAnimals: () =>
    axiosInstance.delete<
      ApiResponse<{
        syncRemoved: number;
        syncAdded: number;
        syncUpdated: number;
        adoptedDeleted: number;
        nullDeleted: number;
        totalRemoved: number;
      }>
    >("/admin/animals/cleanup-invalid", { timeout: 180_000 }),
};

export interface SyncHistoryItem {
  id: number;
  runAt: string;
  triggerType: "AUTO" | "MANUAL";
  addedCount: number;
  updatedCount: number;
  deletedCount: number;
  correctedCount: number;
  errorMessage: string | null;
  daysParam: number | null;
  speciesFilter: string | null;
}
