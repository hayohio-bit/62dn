import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import clsx from "clsx";
import type { BoardResponse } from "@/types/dto";
import type { BoardType } from "@/types/entities";
import { boardApi } from "@/api";
import { useAuthStore } from "@/store/authStore";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Reveal from "@/components/motion/Reveal";
import BoardPagination from "@/components/boards/BoardPagination";
import { BoardTypeBadge, PinnedMark } from "@/components/boards/BoardTypeBadge";
import { BOARD_TYPES, boardTypeTitles, formatBoardDate, isBoardType } from "@/components/boards/boardFormat";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

const PAGE_SIZE_OPTIONS = [10, 15, 20];

const FILTERS: { value?: BoardType; label: string }[] = [
  { label: "전체" },
  // 모바일 한 줄에 들어가도록 FAQ는 약어로 표시한다
  ...BOARD_TYPES.map((t) => ({ value: t, label: t === "FAQ" ? "FAQ" : boardTypeTitles[t] })),
];

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function BoardRowSkeleton() {
  return (
    <div className="grid animate-pulse gap-3 border-b border-ink/10 py-8 md:grid-cols-12" aria-hidden>
      <div className="h-6 w-16 rounded-full bg-ink/10 md:col-span-2" />
      <div className="space-y-3 md:col-span-8">
        <div className="h-6 w-2/3 rounded bg-ink/10" />
        <div className="h-4 w-full rounded bg-ink/5" />
      </div>
    </div>
  );
}

export default function BoardsPage() {
  useDocumentTitle("게시판");
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [searchParams, setSearchParams] = useSearchParams();
  const typeParam = searchParams.get("type");
  // 주소에 알 수 없는 종류가 들어오면 전체 목록으로 본다
  const type = isBoardType(typeParam) ? typeParam : undefined;

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(15);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  const [boards, setBoards] = useState<BoardResponse[]>([]);
  const [totalElements, setTotalElements] = useState(0);

  useEffect(() => {
    // 조건이 바뀐 뒤 늦게 도착한 이전 요청의 응답은 무시한다.
    let cancelled = false;
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await boardApi.getAll({
          type,
          page,
          size: pageSize,
          keyword: search.trim() || undefined,
        });
        if (cancelled) return;
        setBoards(res.content);
        setTotalElements(res.totalElements);
        setLoadFailed(false);
      } catch (err) {
        if (cancelled) return;
        console.error("Failed to fetch boards:", err);
        // 실패 시 이전 조건의 목록이 새 조건의 결과처럼 남지 않도록 비운다.
        setBoards([]);
        setTotalElements(0);
        setLoadFailed(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    const timer = setTimeout(fetchData, 300); // 입력 중 요청이 몰리지 않도록 300ms 뒤에 조회

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [type, page, pageSize, search]);

  const totalPages = Math.ceil(totalElements / pageSize) || 1;

  const handleTypeChange = (newType?: BoardType) => {
    setSearchParams(newType ? { type: newType } : {});
    setPage(0);
  };

  // 로그인하지 않았으면 글쓰기 화면 대신 로그인으로 보내고, 로그인 후 글쓰기로 돌아오게 한다
  const handleWrite = () => {
    if (isAuthenticated) navigate("/boards/write");
    else navigate("/login", { state: { from: "/boards/write" } });
  };

  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <Header />
      <main className="flex-1">
        <Reveal className="dn-page-head flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="dn-eyebrow">Journal</p>
            <h1 className="dn-page-title">게시판</h1>
            <p className="dn-page-desc">
              공지와 자주 묻는 질문, 입양 후기와 보호소 다녀온 이야기를 나누는 공간입니다.
            </p>
          </div>
          <button type="button" onClick={handleWrite} className="toss-btn toss-btn-accent self-start md:self-auto">
            글쓰기
            <span aria-hidden>→</span>
          </button>
        </Reveal>

        <section className="mx-auto max-w-[76rem] px-6 pb-24">
          <div className="flex flex-col gap-4 border-b border-ink/15 pb-6 lg:flex-row lg:items-center lg:justify-between">
            <div
              role="group"
              aria-label="게시판 종류"
              className="-mx-6 flex gap-1 overflow-x-auto px-6 [scrollbar-width:none] lg:mx-0 lg:px-0"
            >
              {FILTERS.map((f) => {
                const active = type === f.value;
                return (
                  <button
                    key={f.label}
                    type="button"
                    aria-pressed={active}
                    onClick={() => handleTypeChange(f.value)}
                    className={clsx(
                      "shrink-0 rounded-full px-4 py-2 text-[0.9375rem] font-medium transition-colors",
                      active ? "bg-ink text-cream" : "text-ink-soft hover:bg-ink/5 hover:text-ink",
                    )}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>

            <div className="relative w-full lg:max-w-sm">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted">
                <SearchIcon />
              </span>
              <input
                type="search"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                placeholder="제목, 내용, 작성자로 검색"
                aria-label="게시글 검색"
                autoComplete="off"
                className="h-12 w-full rounded-full border border-ink/15 bg-white pl-11 pr-11 text-[0.9375rem] text-ink placeholder:text-ink-faint transition focus:border-terracotta focus:outline-none focus:ring-4 focus:ring-terracotta/15 [&::-webkit-search-cancel-button]:hidden"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setPage(0);
                  }}
                  aria-label="검색어 지우기"
                  className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-ink-muted hover:bg-ink/5 hover:text-ink"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div>
              {Array.from({ length: 4 }, (_, i) => (
                <BoardRowSkeleton key={i} />
              ))}
              <p className="sr-only" role="status">
                게시글을 불러오는 중입니다.
              </p>
            </div>
          ) : boards.length === 0 ? (
            <div className="py-24 text-center">
              <p className="font-display text-2xl text-ink">
                {loadFailed
                  ? "게시글을 불러오지 못했어요"
                  : search.trim()
                    ? `‘${search.trim()}’에 맞는 글이 없어요`
                    : "아직 올라온 글이 없어요"}
              </p>
              <p className="mt-3 text-ink-muted">
                {loadFailed
                  ? "잠시 후 다시 시도해 주세요."
                  : search.trim()
                    ? "다른 검색어로 찾아보세요."
                    : "첫 이야기를 남겨 주세요."}
              </p>
            </div>
          ) : (
            <>
              <ul>
                {boards.map((board) => (
                  <li key={board.id}>
                    <Link
                      to={`/boards/${board.id}`}
                      className={clsx(
                        "group grid gap-3 border-b border-ink/10 py-7 transition-colors md:grid-cols-12 md:gap-6 md:py-8",
                        board.isPinned && "-mx-6 bg-cream-50 px-6 md:rounded-2xl",
                      )}
                    >
                      <div className="flex items-center gap-3 md:col-span-2 md:flex-col md:items-start md:gap-2 md:pt-1">
                        <BoardTypeBadge type={board.type} />
                        {board.isPinned && <PinnedMark />}
                      </div>
                      <div className="min-w-0 md:col-span-8">
                        <h2 className="font-display text-xl leading-snug text-ink transition-colors group-hover:text-terracotta md:text-2xl">
                          {board.title}
                        </h2>
                        <p className="mt-2 line-clamp-2 leading-relaxed text-ink-soft">
                          {board.content.replace(/\s+/g, " ")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-ink-muted md:col-span-2 md:flex-col md:items-end md:gap-1 md:pt-1 md:text-right">
                        <span className="text-ink-soft">{board.userName || "익명"}</span>
                        <span aria-hidden className="md:hidden">·</span>
                        <time dateTime={board.createdAt}>{formatBoardDate(board.createdAt)}</time>
                        <span aria-hidden className="md:hidden">·</span>
                        <span>조회 {board.views.toLocaleString()}</span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
              <BoardPagination
                page={page}
                totalPages={totalPages}
                totalElements={totalElements}
                size={pageSize}
                onPageChange={(p) => {
                  setPage(p);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                onSizeChange={(s) => {
                  setPageSize(s);
                  setPage(0);
                }}
                sizeOptions={PAGE_SIZE_OPTIONS}
              />
            </>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
