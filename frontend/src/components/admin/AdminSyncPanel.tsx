import React from "react";
import { SyncHistoryItem } from "@/api/admin";

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
  const { handleSyncFromPublicApi, handleCleanupInvalid, setSyncHistoryPage } =
    actions;

  return (
    <div className="admin-card-body">
      <div className="p-6 rounded-lg bg-gray-50 border border-gray-200 max-w-2xl">
        <h3 className="font-semibold text-gray-800 mb-2">
          공공데이터 입양 동물 동기화
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          최근 3일치 변경분 동기화. 개·고양이 공고중·보호중 데이터가 DB에
          반영됩니다.
        </p>
        <p className="text-xs text-amber-700 mb-4 bg-amber-50 p-2 rounded">
          ※ <strong>500 오류</strong> 시: GET URL용 <strong>Encoding 키</strong>
          (%2F, %3D 포함) 사용. Decoding↔Encoding 바꿔 시도. Swagger에서 직접
          테스트 후 확인. →{" "}
          <a
            href="https://www.data.go.kr/data/15098931/openapi.do"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            구조동물 API
          </a>{" "}
          | docs/PUBLIC_API_REFERENCES.md
        </p>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            className="admin-btn admin-btn-primary"
            disabled={syncLoading}
            onClick={handleSyncFromPublicApi}
          >
            {syncLoading ? "동기화 중..." : "동기화 실행"}
          </button>
          {syncResult && (
            <span className="text-sm text-gray-700">{syncResult}</span>
          )}
        </div>
      </div>
      <div className="p-6 rounded-lg bg-gray-50 border border-gray-200 max-w-2xl mt-6">
        <h3 className="font-semibold text-gray-800 mb-2">
          데이터 만료 보정 (Clean-up)
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          동기화 누락이나 오류로 DB에 방치된 '종료(입양/안락사 등) 및 공고 기한
          만료' 동물 데이터를 일괄 정리합니다.
          <br />
          최근 30일치 데이터를 재검증하며, 현재 날짜 기준 공고 종료일(D-Day)이
          지난 동물은 DB에서 영구 삭제됩니다.
        </p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleCleanupInvalid}
            disabled={cleanupLoading}
            className="admin-btn admin-btn-danger"
          >
            {cleanupLoading ? "보정 중..." : "만료 보정 실행"}
          </button>
          {cleanupResult && (
            <span className="text-sm font-medium text-blue-600 animate-fade-in">
              {cleanupResult}
            </span>
          )}
        </div>
      </div>
      <div className="mt-6">
        <h3 className="font-semibold text-gray-800 mb-3">
          동기화 이력 (자동·수동)
        </h3>
        <p className="text-sm text-gray-600 mb-3">
          매일 새벽 2시 자동 동기화 및 수동 실행 내역. 추가·수정·삭제·만료보정
          건수를 확인할 수 있습니다.
        </p>
        {syncHistoryLoading ? (
          <p className="text-sm text-gray-500">이력 불러오는 중...</p>
        ) : syncHistory.length === 0 ? (
          <p className="text-sm text-gray-500">동기화 이력이 없습니다.</p>
        ) : (
          <>
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th
                      style={{ textAlign: "center" }}
                      className="px-3 py-2 font-semibold text-gray-700"
                    >
                      실행 시각
                    </th>
                    <th
                      style={{ textAlign: "center" }}
                      className="px-3 py-2 font-semibold text-gray-700"
                    >
                      구분
                    </th>
                    <th
                      style={{ textAlign: "center" }}
                      className="px-3 py-2 font-semibold text-gray-700"
                    >
                      추가
                    </th>
                    <th
                      style={{ textAlign: "center" }}
                      className="px-3 py-2 font-semibold text-gray-700"
                    >
                      수정
                    </th>
                    <th
                      style={{ textAlign: "center" }}
                      className="px-3 py-2 font-semibold text-gray-700"
                    >
                      삭제
                    </th>
                    <th
                      style={{ textAlign: "center" }}
                      className="px-3 py-2 font-semibold text-gray-700"
                    >
                      만료보정
                    </th>
                    <th
                      style={{ textAlign: "center" }}
                      className="px-3 py-2 font-semibold text-gray-700"
                    >
                      비고
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {syncHistory.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      <td
                        style={{ textAlign: "center" }}
                        className="px-3 py-2 text-gray-700 whitespace-nowrap"
                      >
                        {new Date(row.runAt).toLocaleString("ko-KR")}
                      </td>
                      <td style={{ textAlign: "center" }} className="px-3 py-2">
                        <span
                          className={
                            row.triggerType === "AUTO"
                              ? "text-blue-600 font-medium"
                              : "text-gray-700"
                          }
                        >
                          {row.triggerType === "AUTO" ? "자동" : "수동"}
                        </span>
                        {row.daysParam != null && (
                          <span className="ml-1 text-gray-500 text-xs">
                            ({row.daysParam}일)
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: "center" }} className="px-3 py-2">
                        {row.addedCount}
                      </td>
                      <td style={{ textAlign: "center" }} className="px-3 py-2">
                        {row.updatedCount}
                      </td>
                      <td style={{ textAlign: "center" }} className="px-3 py-2">
                        {row.deletedCount}
                      </td>
                      <td style={{ textAlign: "center" }} className="px-3 py-2">
                        {row.correctedCount}
                      </td>
                      <td
                        style={{ textAlign: "center" }}
                        className="px-3 py-2 text-gray-600 max-w-xs truncate"
                        title={row.errorMessage ?? undefined}
                      >
                        {row.errorMessage ? (
                          <span className="text-red-600">
                            {row.errorMessage}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {syncHistoryTotalPages > 1 && (
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  className="admin-btn admin-btn-ghost text-sm"
                  disabled={syncHistoryPage === 0}
                  onClick={() => setSyncHistoryPage((p) => Math.max(0, p - 1))}
                >
                  이전
                </button>
                <span className="text-sm text-gray-600">
                  {syncHistoryPage + 1} / {syncHistoryTotalPages} (총{" "}
                  {syncHistoryTotalElements}건)
                </span>
                <button
                  type="button"
                  className="admin-btn admin-btn-ghost text-sm"
                  disabled={syncHistoryPage >= syncHistoryTotalPages - 1}
                  onClick={() => setSyncHistoryPage((p) => p + 1)}
                >
                  다음
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
