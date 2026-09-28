import React from "react";
import { RoleFilter } from "@/api/admin";
import type { UserResponse } from "@/types/dto";

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
      </div>
      {usersError && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-100 flex items-center justify-between gap-2">
          <span>{usersError}</span>
          <button
            type="button"
            className="admin-btn admin-btn-sm admin-btn-ghost"
            onClick={loadUsers}
          >
            다시 불러오기
          </button>
        </div>
      )}
      {usersLoading ? (
        <div className="admin-empty">
          <p>목록 불러오는 중...</p>
        </div>
      ) : users.length === 0 && !usersError ? (
        <div className="admin-empty">
          <div className="admin-empty-icon" aria-hidden>
            👥
          </div>
          <p>조회된 회원이 없습니다.</p>
        </div>
      ) : users.length === 0 && usersError ? null : (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ textAlign: "center" }}>ID</th>
                  <th style={{ textAlign: "center" }}>이메일</th>
                  <th style={{ textAlign: "center" }}>이름</th>
                  <th style={{ textAlign: "center" }}>역할</th>
                  <th style={{ textAlign: "center" }}>가입일</th>
                  <th style={{ textAlign: "center" }}>관리</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td style={{ textAlign: "center" }}>{u.id}</td>
                    <td style={{ textAlign: "center" }}>{u.email}</td>
                    <td style={{ textAlign: "center" }}>{u.name ?? "-"}</td>
                    <td style={{ textAlign: "center" }}>
                      {u.role === "SUPER_ADMIN" ? "시스템 관리자" : "일반 회원"}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString("ko-KR") : "-"}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      {u.role !== "SUPER_ADMIN" && (
                        <button
                          type="button"
                          className="admin-btn admin-btn-xs admin-btn-ghost text-red-500 hover:bg-red-50 hover:text-red-600"
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
              이전
            </button>
            <span className="admin-pagination-info">
              {usersPage + 1} / {Math.max(1, usersTotalPages)} (총 {usersTotalElements}명)
            </span>
            <button
              type="button"
              className="admin-btn admin-btn-ghost"
              disabled={usersPage >= usersTotalPages - 1}
              onClick={() => setUsersPage((p) => p + 1)}
            >
              다음
            </button>
          </div>
        </>
      )}
    </div>
  );
}
