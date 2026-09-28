import React from "react";
import { RoleFilter } from "@/api/admin";
import type { UserResponse } from "@/types/dto";
import { formatBoardDate } from "@/components/boards/boardFormat";

interface Props {
  state: {
    users: UserResponse[];
    usersLoading: boolean;
    usersError: string;
    usersPage: number;
    usersTotalPages: number;
    usersTotalElements: number;
    roleFilter: RoleFilter | "";
  };
  actions: {
    setRoleFilter: (r: RoleFilter | "") => void;
    setUsersPage: React.Dispatch<React.SetStateAction<number>>;
    loadUsers: () => void;
    handleDeleteUser: (id: number, identifier: string) => void;
  };
}

export default function AdminUserTable({ state, actions }: Props) {
  const { users, usersLoading, usersError, usersPage, usersTotalPages, usersTotalElements, roleFilter } = state;
  const { setRoleFilter, setUsersPage, loadUsers, handleDeleteUser } = actions;

  return (
    <div className="admin-card-body">
      <div className="admin-filters">
        <label className="admin-filter-label">
          역할
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value as RoleFilter | "");
              setUsersPage(0);
            }}
            className="admin-select"
          >
            <option value="">전체</option>
            <option value="USER">일반 회원</option>
            <option value="SUPER_ADMIN">시스템 관리자</option>
          </select>
        </label>
        {!usersLoading && !usersError && <span className="admin-filter-count">총 {usersTotalElements.toLocaleString()}명</span>}
      </div>
      {usersError && (
        <div className="admin-alert" role="alert">
          <span>{usersError}</span>
          <button type="button" className="admin-btn admin-btn-sm admin-btn-ghost" onClick={loadUsers}>
            다시 불러오기
          </button>
        </div>
      )}
      {usersLoading ? (
        <div className="admin-empty" role="status">
          목록을 불러오는 중입니다.
        </div>
      ) : users.length === 0 && !usersError ? (
        <div className="admin-empty">
          <p className="admin-empty-title">조회된 회원이 없습니다</p>
          <p>역할 필터를 바꿔 보세요.</p>
        </div>
      ) : users.length === 0 && usersError ? null : (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th className="hidden md:table-cell">ID</th>
                  <th>이름</th>
                  <th className="hidden sm:table-cell">이메일</th>
                  <th>역할</th>
                  <th className="hidden md:table-cell">가입일</th>
                  <th className="!text-right">관리</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="admin-muted hidden md:table-cell">{u.id}</td>
                    <td className="max-w-[11rem] sm:max-w-none">
                      <span className="block whitespace-nowrap font-serif text-base">{u.name ?? "-"}</span>
                      <span className="block truncate text-xs text-ink-muted sm:hidden">{u.email}</span>
                    </td>
                    <td className="hidden max-w-[16rem] truncate text-ink-soft sm:table-cell" title={u.email}>
                      {u.email}
                    </td>
                    <td>
                      <span className={u.role === "SUPER_ADMIN" ? "admin-pill admin-pill--ink" : "admin-pill"}>
                        {u.role === "SUPER_ADMIN" ? "시스템 관리자" : "일반 회원"}
                      </span>
                    </td>
                    <td className="admin-muted hidden md:table-cell">{u.createdAt ? formatBoardDate(u.createdAt) : "-"}</td>
                    <td className="!text-right">
                      {u.role !== "SUPER_ADMIN" && (
                        <button
                          type="button"
                          className="admin-btn admin-btn-sm admin-btn-danger-ghost"
                          onClick={() => handleDeleteUser(u.id, u.name || u.email)}
                        >
                          탈퇴
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="admin-pagination">
            <button
              type="button"
              className="admin-btn admin-btn-ghost"
              disabled={usersPage <= 0}
              onClick={() => setUsersPage((p) => p - 1)}
            >
              ← 이전
            </button>
            <span className="admin-pagination-info">
              {usersPage + 1} / {Math.max(1, usersTotalPages)}
            </span>
            <button
              type="button"
              className="admin-btn admin-btn-ghost"
              disabled={usersPage >= usersTotalPages - 1}
              onClick={() => setUsersPage((p) => p + 1)}
            >
              다음 →
            </button>
          </div>
        </>
      )}
    </div>
  );
}
