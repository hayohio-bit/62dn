import clsx from "clsx";

interface BoardPaginationProps {
  page: number;
  totalPages: number;
  totalElements: number;
  size: number;
  onPageChange: (page: number) => void;
  onSizeChange: (size: number) => void;
  sizeOptions: number[];
}

/** 현재 페이지 주변 번호만 보여 주고 나머지는 말줄임(-1)으로 표시한다 */
function pageWindow(page: number, totalPages: number): number[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i);
  if (page <= 2) return [0, 1, 2, 3, 4, -1, totalPages - 1];
  if (page >= totalPages - 3) return [0, -1, ...Array.from({ length: 5 }, (_, i) => totalPages - 5 + i)];
  return [0, -1, page - 1, page, page + 1, -1, totalPages - 1];
}

const circle =
  "grid h-10 min-w-10 place-items-center rounded-full px-3 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-35";

/** 게시판 목록 하단 페이지 이동 + 페이지당 개수 */
export default function BoardPagination({
  page,
  totalPages,
  totalElements,
  size,
  onPageChange,
  onSizeChange,
  sizeOptions,
}: BoardPaginationProps) {
  const start = totalElements === 0 ? 0 : page * size + 1;
  const end = Math.min((page + 1) * size, totalElements);

  return (
    <div className="mt-10 flex flex-col-reverse items-center gap-5 sm:flex-row sm:justify-between">
      <div className="flex items-center gap-3 text-sm text-ink-muted">
        <span>
          전체 <strong className="font-semibold text-ink">{totalElements}</strong>건 중 {start}–{end}
        </span>
        <label htmlFor="board-page-size" className="sr-only">
          페이지당 개수
        </label>
        <select
          id="board-page-size"
          value={size}
          onChange={(e) => onSizeChange(Number(e.target.value))}
          className="h-9 cursor-pointer rounded-full border border-ink/15 bg-white pl-3.5 pr-8 text-sm text-ink-soft focus:border-terracotta focus:outline-none focus:ring-4 focus:ring-terracotta/15"
        >
          {sizeOptions.map((n) => (
            <option key={n} value={n}>
              {n}개씩
            </option>
          ))}
        </select>
      </div>

      <nav className="flex items-center gap-1" aria-label="페이지 이동">
        <button
          type="button"
          className={clsx(circle, "border border-ink/15 hover:border-ink")}
          disabled={page <= 0}
          onClick={() => onPageChange(page - 1)}
          aria-label="이전 페이지"
        >
          ←
        </button>
        {pageWindow(page, totalPages).map((p, i) =>
          p === -1 ? (
            <span key={`gap-${i}`} className="px-1 text-sm text-ink-faint" aria-hidden>
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              aria-label={`${p + 1}페이지`}
              aria-current={p === page ? "page" : undefined}
              className={clsx(
                circle,
                p === page ? "bg-ink font-semibold text-cream" : "text-ink-soft hover:bg-ink/5 hover:text-ink",
              )}
            >
              {p + 1}
            </button>
          ),
        )}
        <button
          type="button"
          className={clsx(circle, "border border-ink/15 hover:border-ink")}
          disabled={page >= totalPages - 1}
          onClick={() => onPageChange(page + 1)}
          aria-label="다음 페이지"
        >
          →
        </button>
      </nav>
    </div>
  );
}
