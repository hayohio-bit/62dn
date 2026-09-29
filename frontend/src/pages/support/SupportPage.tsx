import { useEffect, useState, useCallback } from "react";
import clsx from "clsx";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ListSearch from "@/components/list/ListSearch";
import FilterBar from "@/components/list/FilterBar";
import Pagination from "@/components/list/Pagination";
import Reveal from "@/components/motion/Reveal";
import { shelterApi } from "@/api";
import type { PublicShelterResponse } from "@/types/entities";
import ShelterDetailModal from "@/components/support/ShelterDetailModal";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

const PAGE_SIZE_OPTIONS = [6, 12, 24];
const REGION_OPTIONS = [
  { value: "", label: "전국" },
  { value: "서울", label: "서울" },
  { value: "경기", label: "경기" },
  { value: "인천", label: "인천" },
  { value: "강원", label: "강원" },
  { value: "대전", label: "대전" },
  { value: "세종", label: "세종" },
  { value: "충남", label: "충남" },
  { value: "충북", label: "충북" },
  { value: "부산", label: "부산" },
  { value: "대구", label: "대구" },
  { value: "울산", label: "울산" },
  { value: "경북", label: "경북" },
  { value: "경남", label: "경남" },
  { value: "광주", label: "광주" },
  { value: "전남", label: "전남" },
  { value: "전북", label: "전북" },
  { value: "제주", label: "제주" },
];

const GUIDES = [
  {
    no: "01",
    title: "봉사",
    lead: "산책, 청소, 목욕처럼 보호소의 하루를 함께 채워 주세요.",
    steps: [
      "아래 목록에서 방문할 수 있는 보호소를 찾아요.",
      "보호소에 전화해 자원봉사 일정과 가능 여부를 물어봐요.",
      "안내받은 날짜와 시간에 보호소를 방문해 봉사해요.",
    ],
  },
  {
    no: "02",
    title: "기부",
    lead: "사료, 담요, 배변 패드처럼 지금 필요한 물품을 보내 주세요.",
    steps: [
      "아래 목록에서 기부할 보호소를 찾아요.",
      "보호소에 전화해 지금 필요한 물품이 무엇인지 물어봐요.",
      "안내받은 방법(택배 또는 방문)으로 물품을 전해요.",
    ],
  },
];

const CAUTIONS = [
  "보호소 상황에 따라 외부 인력의 출입이 제한되거나 봉사 일정이 일찍 마감될 수 있어요.",
  "필요하지 않은 물품이나 상하기 쉬운 음식을 미리 알리지 않고 보내는 일은 삼가 주세요.",
];

export default function SupportPage() {
  useDocumentTitle("봉사·기부 보호소 찾기");
  const [search, setSearch] = useState("");
  const [regionFilter, setRegionFilter] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[1]);

  const [shelters, setShelters] = useState<PublicShelterResponse[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  // 모달용 선택 보호소
  const [selectedShelter, setSelectedShelter] = useState<PublicShelterResponse | null>(null);

  // isCancelled: 조건이 바뀐 뒤 늦게 도착한 이전 요청의 응답을 버리기 위한 확인 함수
  const fetchShelters = useCallback(
    async (isCancelled: () => boolean) => {
      setLoading(true);
      setError(false);
      try {
        const qSelectedRegion = regionFilter || undefined;
        const qKeyword = search.trim() || undefined;
        const res = await shelterApi.getPublicShelters(qSelectedRegion, qKeyword, page, pageSize);
        if (isCancelled()) return;
        setShelters(res.content);
        setTotalPages(res.totalPages || 1);
        setTotalElements(res.totalElements || 0);
      } catch (e) {
        if (isCancelled()) return;
        console.error(e);
        setShelters([]);
        setTotalElements(0);
        setError(true);
      } finally {
        if (!isCancelled()) setLoading(false);
      }
    },
    [regionFilter, search, page, pageSize],
  );

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      fetchShelters(() => cancelled);
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [fetchShelters]);

  const hasFilter = !!(search || regionFilter);
  const resetFilters = () => {
    setSearch("");
    setRegionFilter("");
    setPage(0);
  };

  const renderList = () => {
    if (error) {
      return (
        <div className="rounded-3xl border border-terracotta/25 bg-terracotta-50 px-6 py-14 text-center" role="alert">
          <p className="font-display text-2xl text-ink">보호소 목록을 불러오지 못했어요</p>
          <p className="mt-2 text-sm text-ink-soft">잠시 후 다시 시도해 주세요.</p>
        </div>
      );
    }
    if (loading && shelters.length === 0) {
      return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" aria-hidden>
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="h-44 animate-pulse rounded-3xl bg-cream-200" />
          ))}
        </div>
      );
    }
    if (shelters.length === 0) {
      return (
        <div className="rounded-3xl border border-dashed border-ink/20 px-6 py-16 text-center">
          <p className="font-display text-2xl text-ink">조건에 맞는 보호소가 없어요</p>
          <p className="mt-2 text-sm text-ink-soft">검색어를 줄이거나 지역을 바꿔 보세요.</p>
          {hasFilter && (
            <button type="button" className="toss-btn toss-btn-outline mt-6" onClick={resetFilters}>
              조건 초기화
            </button>
          )}
        </div>
      );
    }
    return (
      <>
        <ul className={clsx("grid gap-4 transition-opacity md:grid-cols-2 lg:grid-cols-3", loading && "opacity-60")}>
          {shelters.map((shelter) => (
            <li key={shelter.id}>
              <button
                type="button"
                data-shelter-card
                onClick={() => setSelectedShelter(shelter)}
                className="group flex h-full w-full flex-col rounded-3xl border border-ink/10 bg-cream-50 p-6 text-left transition duration-300 hover:-translate-y-1 hover:border-ink/20 hover:shadow-lift focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
                aria-haspopup="dialog"
              >
                {shelter.regionSido && (
                  <span className="w-fit rounded-full bg-sage-50 px-2.5 py-1 text-xs font-medium text-sage-600">
                    {[shelter.regionSido, shelter.regionSigungu].filter(Boolean).join(" ")}
                  </span>
                )}
                <span className="mt-3 block font-display text-2xl leading-snug text-ink transition-colors group-hover:text-terracotta">
                  {shelter.name}
                </span>
                <span className="mt-2 block text-sm leading-relaxed text-ink-soft">{shelter.address}</span>
                <span className="mt-auto block w-full pt-5">
                  <span className="flex items-center justify-between gap-3 border-t border-ink/10 pt-4">
                    <span className="text-sm font-semibold tabular-nums text-ink">{shelter.phone || "연락처 없음"}</span>
                    <span
                      aria-hidden
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-ink/20 text-sm transition group-hover:border-terracotta group-hover:bg-terracotta group-hover:text-white"
                    >
                      →
                    </span>
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>

        <Pagination
          page={page}
          totalPages={totalPages}
          totalElements={totalElements}
          size={pageSize}
          onPageChange={setPage}
          onSizeChange={(size) => {
            setPageSize(size);
            setPage(0);
          }}
          sizeOptions={PAGE_SIZE_OPTIONS}
          unit="곳"
        />
      </>
    );
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 pb-24 md:pb-32">
        <header className="dn-page-head">
          <Reveal>
            <p className="dn-eyebrow">Volunteer &amp; Donate</p>
            <h1 className="dn-page-title">
              가까운 보호소에
              <br className="sm:hidden" /> 손을 보태 주세요
            </h1>
            <p className="dn-page-desc">
              유기동물 공고에 등록된 전국 보호소 목록이에요. 봉사와 기부는 보호소마다 받는 방법이 다르니 먼저 전화로 문의해 주세요.
            </p>
            <a href="#shelters" className="toss-btn toss-btn-accent mt-8">
              보호소 찾기 <span aria-hidden>↓</span>
            </a>
          </Reveal>
        </header>

        <div className="mx-auto max-w-[76rem] px-6">
          {/* 봉사·기부 절차 */}
          <section aria-label="봉사·기부 절차" className="grid gap-10 border-t border-ink/15 pt-10 md:grid-cols-2 md:gap-14 md:pt-14">
            {GUIDES.map((g, i) => (
              <Reveal key={g.title} delay={i * 0.08}>
                <div className="flex items-baseline gap-4">
                  <span className="font-display text-lg text-ink-faint" aria-hidden>
                    {g.no}
                  </span>
                  <h2 className="font-display text-4xl text-ink md:text-5xl">{g.title}</h2>
                </div>
                <p className="mt-4 leading-relaxed text-ink-soft">{g.lead}</p>
                <ol className="mt-6 space-y-0 border-t border-ink/10">
                  {g.steps.map((step, si) => (
                    <li key={step} className="flex gap-4 border-b border-ink/10 py-4">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-ink/15 text-xs font-semibold text-ink-soft">
                        {si + 1}
                      </span>
                      <span className="pt-0.5 text-[0.9375rem] leading-relaxed text-ink">{step}</span>
                    </li>
                  ))}
                </ol>
              </Reveal>
            ))}
          </section>

          <Reveal className="mt-10 md:mt-14">
            <aside className="rounded-3xl border border-sage/30 bg-sage-50 p-6 md:flex md:gap-10 md:p-8">
              <p className="shrink-0 font-display text-xl text-ink md:w-48">방문 전에 꼭 확인해 주세요</p>
              <ul className="mt-3 space-y-2 md:mt-0">
                {CAUTIONS.map((c) => (
                  <li key={c} className="flex gap-2.5 text-[0.9375rem] leading-relaxed text-ink-soft">
                    <span aria-hidden className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-sage-600" />
                    {c}
                  </li>
                ))}
              </ul>
            </aside>
          </Reveal>

          {/* 보호소 찾기 */}
          <section
            id="shelters"
            aria-labelledby="shelter-search-title"
            className="mt-24 scroll-mt-[calc(var(--header-height)+1.5rem)] md:mt-32"
          >
            <Reveal className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="dn-eyebrow">Find a shelter</p>
                <h2 id="shelter-search-title" className="mt-3 font-display text-4xl leading-tight text-ink md:text-5xl">
                  보호소 찾기
                </h2>
              </div>
              {!loading && !error && (
                <p className="text-sm text-ink-muted">
                  {hasFilter ? "조건에 맞는 보호소" : "등록된 보호소"}{" "}
                  <strong className="font-semibold text-ink">{totalElements.toLocaleString()}곳</strong>
                </p>
              )}
            </Reveal>

            <div className="list-toolbar border-y border-ink/10 py-5">
              <ListSearch
                value={search}
                onChange={(v) => {
                  setSearch(v);
                  setPage(0);
                }}
                placeholder="보호소 이름, 주소 검색"
              />
              <FilterBar
                groups={[
                  {
                    label: "지역",
                    options: REGION_OPTIONS,
                    value: regionFilter,
                    onChange: (v) => {
                      setRegionFilter(v);
                      setPage(0);
                    },
                  },
                ]}
                onReset={hasFilter ? resetFilters : undefined}
              />
            </div>

            <div className="mt-8" aria-busy={loading}>
              {renderList()}
            </div>
          </section>
        </div>
      </main>
      <Footer />

      {/* 보호소 상세보기 모달 */}
      {selectedShelter && <ShelterDetailModal shelter={selectedShelter} onClose={() => setSelectedShelter(null)} />}
    </div>
  );
}
