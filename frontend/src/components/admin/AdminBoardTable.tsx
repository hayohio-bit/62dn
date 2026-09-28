import React from "react";
import { Link } from "react-router-dom";
import type { BoardResponse } from "@/types/dto";

interface Props {
  state: {
    boards: BoardResponse[];
    boardsLoading: boolean;
    boardsError: string;
    boardsPage: number;
    boardsTotalPages: number;
    boardTypeFilter: string;
    boardActionLoading: number | null;
  };
  actions: {
    setBoardTypeFilter: (t: string) => void;
    setBoardsPage: React.Dispatch<React.SetStateAction<number>>;
    loadBoards: () => void;
    handleSetBoardPinned: (id: number, pinned: boolean) => void;
    handleDeleteBoard: (id: number) => void;
  };
}

export default function AdminBoardTable({ state, actions }: Props) {
  const { boards, boardsLoading, boardsError, boardsPage, boardsTotalPages, boardTypeFilter, boardActionLoading } = state;
  const { setBoardTypeFilter, setBoardsPage, loadBoards, handleSetBoardPinned, handleDeleteBoard } = actions;

  return (
    <div className="admin-card-body">
      <div className="admin-filters">
        <label className="admin-filter-label">
          게시판
          <select
            value={boardTypeFilter}
            onChange={(e) => {
              setBoardTypeFilter(e.target.value);
              setBoardsPage(0);
            }}
            className="admin-select"
          >
            <option value="">전체</option>
            <option value="NOTICE">공지</option>
            <option value="FAQ">FAQ</option>
            <option value="FREE">자유</option>
          </select>
        </label>
      </div>
      {boardsError && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-100 flex items-center justify-between gap-2">
          <span>{boardsError}</span>
          <button
            type="button"
            className="admin-btn admin-btn-sm admin-btn-ghost"
            onClick={loadBoards}
          >
            다시 불러오기
          </button>
        </div>
      )}
      {boardsLoading ? (
        <div className="admin-empty">
          <p>목록 불러오는 중...</p>
        </div>
      ) : boards.length === 0 && !boardsError ? (
        <div className="admin-empty">
          <div className="admin-empty-icon" aria-hidden>📋</div>
          <p>조회된 게시글이 없습니다. 게시판에서 글을 작성하면 여기에서 관리할 수 있습니다.</p>
          <p className="mt-2 text-sm">
            <Link to="/boards" className="admin-foot a">게시판 목록 보기 →</Link>
          </p>
        </div>
      ) : boards.length === 0 && boardsError ? null : (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ textAlign: "center" }}>ID</th>
                  <th style={{ textAlign: "center" }}>타입</th>
                  <th style={{ textAlign: "center" }}>제목</th>
                  <th style={{ textAlign: "center" }}>작성자</th>
                  <th style={{ textAlign: "center" }}>고정</th>
                  <th style={{ textAlign: "center" }}>작성일</th>
                  <th style={{ textAlign: "center" }}>관리</th>
                </tr>
              </thead>
              <tbody>
                {boards.map((b) => (
                  <tr key={b.id}>
                    <td style={{ textAlign: "center" }}>{b.id}</td>
                    <td style={{ textAlign: "center" }}>
                      {b.type === "NOTICE" ? "공지" : b.type === "FAQ" ? "FAQ" : "자유"}
                    </td>
                    <td style={{ textAlign: "left" }}>{b.title}</td>
                    <td style={{ textAlign: "center" }}>{b.userName ?? "-"}</td>
                    <td style={{ textAlign: "center" }}>{b.isPinned ? "고정" : "-"}</td>
                    <td style={{ textAlign: "center" }}>
                      {b.createdAt ? new Date(b.createdAt).toLocaleDateString("ko-KR") : "-"}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <button
                        type="button"
                        className="admin-btn admin-btn-sm admin-btn-ghost"
                        disabled={boardActionLoading === b.id}
                        onClick={() => handleSetBoardPinned(b.id, !b.isPinned)}
                      >
                        {boardActionLoading === b.id ? "..." : b.isPinned ? "고정 해제" : "고정"}
                      </button>
                      <button
                        type="button"
                        className="admin-btn admin-btn-sm admin-btn-danger"
                        disabled={boardActionLoading === b.id}
                        onClick={() => handleDeleteBoard(b.id)}
                      >
                        삭제
                      </button>
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
              disabled={boardsPage <= 0}
              onClick={() => setBoardsPage((p) => p - 1)}
            >
              이전
            </button>
            <span className="admin-pagination-info">
              {boardsPage + 1} / {Math.max(1, boardsTotalPages)}
            </span>
            <button
              type="button"
              className="admin-btn admin-btn-ghost"
              disabled={boardsPage >= boardsTotalPages - 1}
              onClick={() => setBoardsPage((p) => p + 1)}
            >
              다음
            </button>
          </div>
        </>
      )}
    </div>
  );
}
