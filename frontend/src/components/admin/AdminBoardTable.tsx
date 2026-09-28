import React from "react";
import { Link } from "react-router-dom";
import type { BoardResponse } from "@/types/dto";
import { BoardTypeBadge } from "@/components/boards/BoardTypeBadge";
import { formatBoardDate } from "@/components/boards/boardFormat";

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
  const { boards, boardsLoading, boardsError, boardsPage, boardsTotalPages, boardTypeFilter, boardActionLoading } =
    state;
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
        <Link to="/boards/write" className="admin-btn admin-btn-primary">
          새 글 쓰기
        </Link>
      </div>
      {boardsError && (
        <div className="admin-alert" role="alert">
          <span>{boardsError}</span>
          <button type="button" className="admin-btn admin-btn-sm admin-btn-ghost" onClick={loadBoards}>
            다시 불러오기
          </button>
        </div>
      )}
      {boardsLoading ? (
        <div className="admin-empty" role="status">
          목록을 불러오는 중입니다.
        </div>
      ) : boards.length === 0 && !boardsError ? (
        <div className="admin-empty">
          <p className="admin-empty-title">조회된 게시글이 없습니다</p>
          <p>
            게시판에서 글을 작성하면 여기에서 관리할 수 있습니다. <Link to="/boards">게시판 보기 →</Link>
          </p>
        </div>
      ) : boards.length === 0 && boardsError ? null : (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th className="hidden md:table-cell">ID</th>
                  <th className="hidden sm:table-cell">종류</th>
                  <th>제목</th>
                  <th className="hidden md:table-cell">작성자</th>
                  <th className="hidden lg:table-cell">작성일</th>
                  <th className="!text-right">관리</th>
                </tr>
              </thead>
              <tbody>
                {boards.map((b) => (
                  <tr key={b.id}>
                    <td className="admin-muted hidden md:table-cell">{b.id}</td>
                    <td className="hidden sm:table-cell">
                      <BoardTypeBadge type={b.type} />
                    </td>
                    <td className="sm:min-w-[14rem]">
                      <div className="flex flex-wrap items-center gap-2">
                        <BoardTypeBadge type={b.type} className="sm:hidden" />
                        {b.isPinned && <span className="admin-pill admin-pill--accent">고정</span>}
                      </div>
                      <Link
                        to={`/boards/${b.id}`}
                        className="mt-1 line-clamp-2 font-serif text-base hover:text-terracotta sm:mt-0 sm:line-clamp-1"
                      >
                        {b.title}
                      </Link>
                    </td>
                    <td className="hidden whitespace-nowrap text-ink-soft md:table-cell">{b.userName ?? "-"}</td>
                    <td className="admin-muted hidden lg:table-cell">{formatBoardDate(b.createdAt)}</td>
                    <td className="!text-right">
                      <div className="admin-btn-group flex-col items-end sm:flex-row sm:justify-end">
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
                          className="admin-btn admin-btn-sm admin-btn-danger-ghost"
                          disabled={boardActionLoading === b.id}
                          onClick={() => handleDeleteBoard(b.id)}
                        >
                          삭제
                        </button>
                      </div>
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
              ← 이전
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
              다음 →
            </button>
          </div>
        </>
      )}
    </div>
  );
}
