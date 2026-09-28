import React from "react";
import { SyncHistoryItem } from "@/api/admin";
import { formatBoardDateTime } from "@/components/boards/boardFormat";

interface Props {
  state: {
    syncLoading: boolean;
    syncResult: string | null;
    cleanupLoading: boolean;
    cleanupResult: string | null;
    syncHistory: SyncHistoryItem[];
    syncHistoryLoading: boolean;
    syncHistoryPage: number;
    syncHistoryTotalPages: number;
    syncHistoryTotalElements: number;
  };
  actions: {
    handleSyncFromPublicApi: () => void;
    handleCleanupInvalid: () => void;
    setSyncHistoryPage: React.Dispatch<React.SetStateAction<number>>;
  };
}

export default function AdminSyncPanel({ state, actions }: Props) {
  const {
    syncLoading,
    syncResult,
    cleanupLoading,
    cleanupResult,
    syncHistory,
    syncHistoryLoading,
    syncHistoryPage,
    syncHistoryTotalPages,
    syncHistoryTotalElements,
  } = state;
  const { handleSyncFromPublicApi, handleCleanupInvalid, setSyncHistoryPage } = actions;

  return (
    <div className="admin-card-body">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="admin-panel">
          <h3 className="admin-panel-title">입양 동물 동기화</h3>
          <p className="admin-panel-text">
            최근 3일치 변경분을 가져옵니다. 개·고양이 중 공고 중·보호 중인 데이터가 DB에 반영됩니다.
          </p>
          <p className="admin-note">
            500 오류가 나면 GET URL용 <strong>Encoding 키</strong>(%2F, %3D 포함)를 쓰고 있는지 확인하세요.
            Decoding·Encoding 키를 바꿔 보고, Swagger에서 직접 호출해 확인할 수 있습니다.{" "}
            <a href="https://www.data.go.kr/data/15098931/openapi.do" target="_blank" rel="noopener noreferrer">
              구조동물 API
            </a>{" "}
            · docs/PUBLIC_API_REFERENCES.md
          </p>
          <div className="mt-auto flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              className="admin-btn admin-btn-primary"
              disabled={syncLoading}
              onClick={handleSyncFromPublicApi}
            >
              {syncLoading ? "동기화 중..." : "동기화 실행"}
            </button>
            {syncResult && (
              <span className="admin-result" role="status">
                {syncResult}
              </span>
            )}
          </div>
        </div>

        <div className="admin-panel">
          <h3 className="admin-panel-title">만료 데이터 정리</h3>
          <p className="admin-panel-text">
            동기화 누락이나 오류로 남은 종료(입양·안락사 등)·공고 기한 만료 동물 데이터를 한 번에 정리합니다. 최근
            30일치를 다시 확인하고, 공고 종료일이 지난 동물은 DB에서 영구 삭제됩니다.
          </p>
          <div className="mt-auto flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleCleanupInvalid}
              disabled={cleanupLoading}
              className="admin-btn admin-btn-danger"
            >
              {cleanupLoading ? "정리 중..." : "만료 데이터 정리"}
            </button>
            {cleanupResult && (
              <span className="admin-result" role="status">
                {cleanupResult}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-10">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h3 className="admin-panel-title">동기화 이력</h3>
            <p className="admin-panel-text mt-1">
              매일 새벽 2시 자동 동기화와 수동 실행 내역입니다. 추가·수정·삭제·만료 정리 건수를 확인할 수 있습니다.
            </p>
          </div>
          {syncHistoryTotalElements > 0 && (
            <span className="admin-filter-count">총 {syncHistoryTotalElements.toLocaleString()}건</span>
          )}
        </div>
        {syncHistoryLoading ? (
          <div className="admin-empty" role="status">
            이력을 불러오는 중입니다.
          </div>
        ) : syncHistory.length === 0 ? (
          <div className="admin-empty">
            <p className="admin-empty-title">동기화 이력이 없습니다</p>
          </div>
        ) : (
          <>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>실행 시각</th>
                    <th>구분</th>
                    <th className="admin-num">추가</th>
                    <th className="admin-num">수정</th>
                    <th className="admin-num">삭제</th>
                    <th className="admin-num">만료 정리</th>
                    <th>비고</th>
                  </tr>
                </thead>
                <tbody>
                  {syncHistory.map((row) => (
                    <tr key={row.id}>
                      <td className="admin-muted">{formatBoardDateTime(row.runAt)}</td>
                      <td className="whitespace-nowrap">
                        <span className={row.triggerType === "AUTO" ? "admin-pill admin-pill--sage" : "admin-pill"}>
                          {row.triggerType === "AUTO" ? "자동" : "수동"}
                        </span>
                        {row.daysParam != null && <span className="ml-1.5 text-xs text-ink-muted">{row.daysParam}일</span>}
                      </td>
                      <td className="admin-num">{row.addedCount}</td>
                      <td className="admin-num">{row.updatedCount}</td>
                      <td className="admin-num">{row.deletedCount}</td>
                      <td className="admin-num">{row.correctedCount}</td>
                      <td className="max-w-xs truncate" title={row.errorMessage ?? undefined}>
                        {row.errorMessage ? (
                          <span className="text-terracotta-700">{row.errorMessage}</span>
                        ) : (
                          <span className="text-ink-faint">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {syncHistoryTotalPages > 1 && (
              <div className="admin-pagination">
                <button
                  type="button"
                  className="admin-btn admin-btn-ghost"
                  disabled={syncHistoryPage === 0}
                  onClick={() => setSyncHistoryPage((p) => Math.max(0, p - 1))}
                >
                  ← 이전
                </button>
                <span className="admin-pagination-info">
                  {syncHistoryPage + 1} / {syncHistoryTotalPages}
                </span>
                <button
                  type="button"
                  className="admin-btn admin-btn-ghost"
                  disabled={syncHistoryPage >= syncHistoryTotalPages - 1}
                  onClick={() => setSyncHistoryPage((p) => p + 1)}
                >
                  다음 →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
