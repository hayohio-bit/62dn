import { useState, useEffect, useCallback } from "react";
import { adminApi, RoleFilter, SyncHistoryItem } from "@/api/admin";
import type { UserResponse, BoardResponse } from "@/types/dto";
import { useAuthStore } from "@/store/authStore";

export type AdminTab = "members" | "boards" | "approvals" | "sync";

type ApiError = { response?: { status?: number; data?: { message?: string } } };

/** 서버 메시지가 있으면 그대로, 403이면 권한 안내, 그 외에는 기본 문구 */
function listErrorMessage(e: unknown, fallback: string): string {
  const err = e as ApiError;
  const serverMessage = err.response?.data?.message;
  if (serverMessage) return serverMessage;
  if (err.response?.status === 403) return "권한이 없습니다.";
  return fallback;
}

/** 조건이 바뀐 뒤 늦게 도착한 응답을 버리기 위한 확인 함수 (기본값: 항상 유효) */
type IsCancelled = () => boolean;
const notCancelled: IsCancelled = () => false;

export function useAdminDashboard() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<AdminTab>("members");

  const [users, setUsers] = useState<UserResponse[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState("");
  const [usersPage, setUsersPage] = useState(0);
  const [usersTotalPages, setUsersTotalPages] = useState(0);
  const [usersTotalElements, setUsersTotalElements] = useState(0);
  const [roleFilter, setRoleFilter] = useState<RoleFilter | "">("");

  const [boards, setBoards] = useState<BoardResponse[]>([]);
  const [boardsLoading, setBoardsLoading] = useState(false);
  const [boardsError, setBoardsError] = useState("");
  const [boardsPage, setBoardsPage] = useState(0);
  const [boardsTotalPages, setBoardsTotalPages] = useState(0);
  const [boardTypeFilter, setBoardTypeFilter] = useState<string>("");
  const [boardActionLoading, setBoardActionLoading] = useState<number | null>(null);

  const [syncLoading, setSyncLoading] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<string | null>(null);
  const [syncHistory, setSyncHistory] = useState<SyncHistoryItem[]>([]);
  
  const [syncHistoryLoading, setSyncHistoryLoading] = useState(false);
  const [syncHistoryPage, setSyncHistoryPage] = useState(0);
  const [syncHistoryTotalPages, setSyncHistoryTotalPages] = useState(0);
  const [syncHistoryTotalElements, setSyncHistoryTotalElements] = useState(0);

  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  const fetchSyncHistory = useCallback(async (page: number, isCancelled: IsCancelled = notCancelled) => {
    setSyncHistoryLoading(true);
    try {
      const res = await adminApi.getSyncHistory(page, 20);
      if (isCancelled()) return;
      const payload = res.data?.data ?? res.data;
      if (payload?.content) {
        setSyncHistory(payload.content);
        setSyncHistoryTotalPages(payload.totalPages ?? 0);
        setSyncHistoryTotalElements(payload.totalElements ?? 0);
      }
    } catch {
      if (isCancelled()) return;
      setSyncHistory([]);
    } finally {
      if (!isCancelled()) setSyncHistoryLoading(false);
    }
  }, []);

  /** 동기화·정리 실행 후 이력을 첫 페이지부터 다시 조회 */
  const reloadSyncHistoryFirstPage = () => {
    setSyncHistoryPage(0);
    fetchSyncHistory(0);
  };

  const handleSyncFromPublicApi = async () => {
    setSyncLoading(true);
    setSyncResult(null);
    try {
      const res = await adminApi.syncFromPublicApi({ days: 3 });
      const data = res.data?.data ?? res.data;
      const added = data?.addedCount ?? 0;
      const updated = data?.updatedCount ?? 0;
      const removed = data?.removedCount ?? 0;
      const apiKeyOk = data?.apiKeyConfigured !== false;
      if (!apiKeyOk) {
        setSyncResult("API 키가 설정되지 않았습니다. backend/.env 에 DATA_API_KEY 를 확인하세요.");
      } else if (added === 0 && updated === 0 && removed === 0) {
        setSyncResult("동기화 완료: 변경 없음 (신규/수정된 데이터 없음)");
      } else {
        const parts: string[] = [];
        if (added > 0) parts.push(`추가 ${added}마리`);
        if (updated > 0) parts.push(`수정 ${updated}마리`);
        if (removed > 0) parts.push(`삭제 ${removed}마리`);
        setSyncResult(`동기화 완료: ${parts.join(", ")}`);
      }
      reloadSyncHistoryFirstPage();
      setTimeout(() => setSyncResult(null), 8000);
    } catch (e: unknown) {
      const msg = (e as ApiError)?.response?.data?.message;
      setSyncResult(msg ?? "동기화 실패");
      reloadSyncHistoryFirstPage();
    } finally {
      setSyncLoading(false);
    }
  };

  const handleCleanupInvalid = async () => {
    setCleanupLoading(true);
    setCleanupResult(null);
    try {
      const res = await adminApi.cleanupInvalidAnimals();
      const data = res.data?.data ?? res.data;
      const totalRemoved = data?.totalRemoved ?? 0;
      const syncRemoved = data?.syncRemoved ?? 0;
      const adoptedDel = data?.adoptedDeleted ?? 0;
      const nullDel = data?.nullDeleted ?? 0;
      if (totalRemoved === 0) {
        setCleanupResult("동기화 + 정리 완료: 비보호 동물 없음");
      } else {
        const parts: string[] = [];
        if (syncRemoved > 0) parts.push(`동기화 중 ${syncRemoved}마리 제거`);
        if (adoptedDel > 0) parts.push(`ADOPTED ${adoptedDel}마리 삭제`);
        if (nullDel > 0) parts.push(`NULL ${nullDel}마리 삭제`);
        setCleanupResult(`정리 완료: ${parts.join(", ")} (총 ${totalRemoved}마리)`);
      }
      reloadSyncHistoryFirstPage();
      setTimeout(() => setCleanupResult(null), 12000);
    } catch (e: unknown) {
      const msg = (e as ApiError)?.response?.data?.message;
      setCleanupResult(msg ?? "정리 실패");
      reloadSyncHistoryFirstPage();
    } finally {
      setCleanupLoading(false);
    }
  };

  const fetchUsers = useCallback(async (isCancelled: IsCancelled = notCancelled) => {
    setUsersError("");
    setUsersLoading(true);
    try {
      const role = roleFilter === "" ? undefined : (roleFilter as RoleFilter);
      const res = await adminApi.getUsers(usersPage, 20, role);
      if (isCancelled()) return;
      const data = res.data?.data ?? res.data;
      setUsers(data?.content ?? []);
      setUsersTotalPages(data?.totalPages ?? 0);
      setUsersTotalElements(data?.totalElements ?? 0);
    } catch (e: unknown) {
      if (isCancelled()) return;
      setUsersError(listErrorMessage(e, "회원 목록을 불러오지 못했습니다."));
      setUsers([]);
    } finally {
      if (!isCancelled()) setUsersLoading(false);
    }
  }, [usersPage, roleFilter]);

  /** 새로고침 버튼용 (클릭 이벤트 인자를 넘기지 않도록 감싼다) */
  const loadUsers = useCallback(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleDeleteUser = async (userId: number, identifier: string) => {
    if (!window.confirm(`'${identifier}' 회원을 정말로 탈퇴시키겠습니까?\n이 작업은 되돌릴 수 없으며, 작성한 게시글과 신청 내역이 모두 삭제됩니다.`)) {
      return;
    }
    setUsersError("");
    try {
      await adminApi.deleteUser(userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      alert("회원이 탈퇴 처리되었습니다.");
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      const msg = err.response?.data?.message ?? "회원 탈퇴 처리에 실패했습니다.";
      alert(msg);
    }
  };

  const fetchBoards = useCallback(async (isCancelled: IsCancelled = notCancelled) => {
    setBoardsError("");
    setBoardsLoading(true);
    try {
      const type = boardTypeFilter === "" ? undefined : boardTypeFilter;
      const res = await adminApi.getBoards(boardsPage, 20, type);
      if (isCancelled()) return;
      const data = res.data?.data ?? res.data;
      setBoards(data?.content ?? []);
      setBoardsTotalPages(data?.totalPages ?? 0);
    } catch (e: unknown) {
      if (isCancelled()) return;
      setBoardsError(listErrorMessage(e, "게시글 목록을 불러오지 못했습니다."));
      setBoards([]);
    } finally {
      if (!isCancelled()) setBoardsLoading(false);
    }
  }, [boardsPage, boardTypeFilter]);

  /** 새로고침 버튼용 (클릭 이벤트 인자를 넘기지 않도록 감싼다) */
  const loadBoards = useCallback(() => {
    fetchBoards();
  }, [fetchBoards]);

  useEffect(() => {
    if (!isSuperAdmin || activeTab !== "members") return;
    let cancelled = false;
    fetchUsers(() => cancelled);
    return () => {
      cancelled = true;
    };
  }, [isSuperAdmin, activeTab, fetchUsers]);

  useEffect(() => {
    if (!isSuperAdmin || activeTab !== "boards") return;
    let cancelled = false;
    fetchBoards(() => cancelled);
    return () => {
      cancelled = true;
    };
  }, [isSuperAdmin, activeTab, fetchBoards]);

  useEffect(() => {
    if (!isSuperAdmin || activeTab !== "sync") return;
    let cancelled = false;
    fetchSyncHistory(syncHistoryPage, () => cancelled);
    return () => {
      cancelled = true;
    };
  }, [isSuperAdmin, activeTab, syncHistoryPage, fetchSyncHistory]);

  const handleSetBoardPinned = async (boardId: number, pinned: boolean) => {
    setBoardActionLoading(boardId);
    try {
      await adminApi.setBoardPinned(boardId, pinned);
      setBoards((prev) => prev.map((b) => (b.id === boardId ? { ...b, isPinned: pinned } : b)));
    } catch (e: unknown) {
      alert(listErrorMessage(e, pinned ? "게시글 고정에 실패했습니다." : "게시글 고정 해제에 실패했습니다."));
    } finally {
      setBoardActionLoading(null);
    }
  };

  const handleDeleteBoard = async (boardId: number) => {
    // 삭제는 되돌릴 수 없으므로 회원 탈퇴·게시글 상세 삭제와 같이 확인을 받는다.
    if (!window.confirm("이 게시글을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.")) return;
    setBoardActionLoading(boardId);
    try {
      await adminApi.deleteBoard(boardId);
      setBoards((prev) => prev.filter((b) => b.id !== boardId));
    } catch (e: unknown) {
      alert(listErrorMessage(e, "게시글 삭제에 실패했습니다."));
    } finally {
      setBoardActionLoading(null);
    }
  };

  return {
    activeTab, setActiveTab,
    usersState: { users, usersLoading, usersError, usersPage, usersTotalPages, usersTotalElements, roleFilter },
    usersActions: { setRoleFilter, setUsersPage, loadUsers, handleDeleteUser },
    boardsState: { boards, boardsLoading, boardsError, boardsPage, boardsTotalPages, boardTypeFilter, boardActionLoading },
    boardsActions: { setBoardTypeFilter, setBoardsPage, loadBoards, handleSetBoardPinned, handleDeleteBoard },
    syncState: { syncLoading, syncResult, cleanupLoading, cleanupResult, syncHistory, syncHistoryLoading, syncHistoryPage, syncHistoryTotalPages, syncHistoryTotalElements },
    syncActions: { handleSyncFromPublicApi, handleCleanupInvalid, setSyncHistoryPage }
  };
}
