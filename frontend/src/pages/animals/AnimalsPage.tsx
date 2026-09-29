import { useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import clsx from "clsx";
import ListSearch from "@/components/list/ListSearch";
import Pagination from "@/components/list/Pagination";
import FilterBar from "@/components/list/FilterBar";
import PreferenceModal from "@/components/animals/PreferenceModal";
import FavoriteButton from "@/components/animals/FavoriteButton";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AnimalImageFallback from "@/components/animals/AnimalImageFallback";
import Reveal from "@/components/motion/Reveal";
import { REGION_SIDO_OPTIONS, SIGUNGU_BY_SIDO } from "@/constants/regions";
import { ddayTone, formatDday, genderLabels, sizeLabels, speciesLabels } from "@/constants/animalLabels";
import { useAnimals } from "@/hooks/useAnimals";
import { useAuthStore } from "@/store/authStore";
import type { Animal } from "@/types/entities";

const PAGE_SIZE_OPTIONS = [8, 12, 20];

const SORT_OPTIONS = [
  { value: "noticeEndDate,asc", label: "공고 마감 임박순" },
  { value: "noticeStartDate,desc", label: "새로 들어온 순" },
];

function formatAgeRange(min?: number, max?: number) {
  if (min === undefined && max === undefined) return "나이 무관";
  if (max === undefined) return `${min}살 이상`;
  if (min === undefined) return `${max}살 이하`;
  return `${min}~${max}살`;
}

const ddayBadgeClass = (days: number | null | undefined) => {
  if (days != null && days < 0) return "bg-ink/70 text-cream";
  const tone = ddayTone(days);
  if (tone === "urgent") return "bg-terracotta text-white";
  if (tone === "soon") return "bg-cream-50 text-terracotta";
  return "bg-cream-50/90 text-ink";
};

function AnimalCard({
  animal,
  favorited,
  onFavoriteToggle,
  index,
}: {
  animal: Animal;
  favorited: boolean;
  onFavoriteToggle: (added: boolean) => void;
  index: number;
}) {
  const dday = formatDday(animal.daysUntilExpiry);
  const meta = [
    animal.age != null ? `${animal.age}살` : "나이 미상",
    genderLabels[animal.gender] ?? "성별 미상",
    sizeLabels[animal.size],
  ]
    .filter(Boolean)
    .join(" · ");
  const breed = [speciesLabels[animal.species], animal.breed].filter(Boolean).join(" · ");

  return (
    <Reveal delay={Math.min(index % 4, 3) * 0.06} y={20} className="relative">
      <Link
        to={`/animals/${animal.id}`}
        state={{ fromList: true }}
        className="group block rounded-3xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-terracotta"
      >
        <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-cream-200">
          {animal.imageUrl ? (
            <img
              src={animal.imageUrl}
              alt={`${animal.name || "보호 중인 동물"} 사진`}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-105"
            />
          ) : (
            <AnimalImageFallback />
          )}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-ink/25 to-transparent opacity-0 transition duration-500 group-hover:opacity-100" />
          {dday && (
            <span
              className={clsx(
                "absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-bold tabular-nums shadow-sm",
                ddayBadgeClass(animal.daysUntilExpiry),
              )}
            >
              {dday}
              <span className="sr-only"> 공고 마감</span>
            </span>
          )}
        </div>
        <div className="px-1 pt-4">
          <h3 className="truncate font-serif text-[1.375rem] leading-tight text-ink transition-colors group-hover:text-terracotta md:text-2xl">
            {animal.name || "이름 없음"}
          </h3>
          <p className="mt-1.5 text-sm text-ink-soft">{meta}</p>
          {breed && <p className="mt-0.5 truncate text-sm text-ink-muted">{breed}</p>}
          {animal.shelterName && (
            <p className="mt-2 flex items-center gap-1 text-xs text-ink-muted">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden className="shrink-0">
                <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
                <circle cx="12" cy="9.5" r="2.5" />
              </svg>
              <span className="truncate">{animal.shelterName}</span>
            </p>
          )}
        </div>
      </Link>
      {/* 링크 안에 버튼을 넣으면 중첩된 대화형 요소가 되므로 카드 위에 따로 겹쳐 둔다 */}
      <div className="absolute right-3 top-3 z-10">
        <FavoriteButton animalId={animal.id} isFavorited={favorited} onToggle={onFavoriteToggle} size="md" />
      </div>
    </Reveal>
  );
}

function SkeletonGrid({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 md:gap-x-6 md:gap-y-12 lg:grid-cols-4" aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-[4/5] rounded-3xl bg-cream-200" />
          <div className="mt-4 h-6 w-1/2 rounded-full bg-cream-200" />
          <div className="mt-2 h-4 w-3/4 rounded-full bg-cream-200/70" />
        </div>
      ))}
    </div>
  );
}

export default function AnimalsPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { state, actions } = useAnimals();

  const {
    loading, error, viewMode, search, species, size, gender, region, sigungu, sort,
    page, pageSize, preference, showPreferenceModal, favoriteIds,
    animals, totalPages, apiTotalElements,
  } = state;

  const {
    setViewMode, setSearch, setSpecies, setSize, setGender, setRegion, setSigungu, setSort,
    setPage, setPageSize, setShowPreferenceModal, setFavoriteIds, handleSavePreference, resetFilters,
  } = actions;

  const hasFilter = !!(search || species || size || gender || region || sigungu);
  const activeFilterCount = [species, size, gender, region].filter(Boolean).length;
  // 모바일에서는 필터가 첫 화면을 차지하지 않도록 접어 두고, 버튼으로 펼친다
  const [filtersOpen, setFiltersOpen] = useState(false);

  const openRecommended = () => {
    // 추천은 로그인한 사용자의 선호도로 계산되므로, 비로그인 상태면 로그인 후 이 화면으로 돌아오게 한다
    if (!isAuthenticated) {
      navigate("/login", { state: { from: "/animals" } });
      return;
    }
    if (!preference) setShowPreferenceModal(true);
    else {
      setViewMode("recommended");
      setPage(0);
    }
  };

  const preferenceSummary = preference
    ? [
        preference.species ? speciesLabels[preference.species] : "종류 무관",
        formatAgeRange(preference.minAge, preference.maxAge),
        preference.size ? sizeLabels[preference.size] : "크기 무관",
        preference.regions?.length ? preference.regions.join(", ") : "전국",
      ]
    : [];

  const renderContent = () => {
    if (error) {
      return (
        <div className="rounded-3xl border border-terracotta/25 bg-terracotta-50 px-6 py-14 text-center" role="alert">
          <p className="font-serif text-2xl text-ink">목록을 불러오지 못했어요</p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-soft">{error}</p>
        </div>
      );
    }

    if (loading) return <SkeletonGrid count={Math.min(pageSize, 8)} />;

    if (animals.length === 0) {
      return (
        <div className="rounded-3xl border border-dashed border-ink/20 px-6 py-20 text-center">
          <p className="font-serif text-3xl text-ink">
            {viewMode === "recommended" ? "지금은 조건에 맞는 아이가 없어요" : "조건에 맞는 아이가 없어요"}
          </p>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-ink-soft">
            {viewMode === "recommended"
              ? "선호 조건을 조금 넓히면 더 많은 아이를 만날 수 있어요."
              : "검색어나 필터를 바꾸거나 초기화해 보세요."}
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            {viewMode === "recommended" ? (
              <button type="button" className="toss-btn toss-btn-outline" onClick={() => setShowPreferenceModal(true)}>
                선호 조건 바꾸기
              </button>
            ) : (
              <button type="button" className="toss-btn toss-btn-outline" onClick={resetFilters}>
                필터 초기화
              </button>
            )}
          </div>
        </div>
      );
    }

    return (
      <>
        <div className="grid grid-cols-2 gap-x-4 gap-y-9 md:grid-cols-3 md:gap-x-6 md:gap-y-14 lg:grid-cols-4">
          {animals.map((animal, i) => (
            <AnimalCard
              key={animal.id}
              animal={animal}
              index={i}
              favorited={favoriteIds.includes(animal.id)}
              onFavoriteToggle={(added) =>
                setFavoriteIds((prev) => (added ? [...prev, animal.id] : prev.filter((id) => id !== animal.id)))
              }
            />
          ))}
        </div>
        <Pagination
          page={page}
          totalPages={totalPages}
          totalElements={apiTotalElements}
          size={pageSize}
          onPageChange={setPage}
          onSizeChange={setPageSize}
          sizeOptions={PAGE_SIZE_OPTIONS}
          unit="마리"
        />
      </>
    );
  };

  const tabClass = (active: boolean) =>
    clsx(
      "inline-flex h-10 items-center gap-1.5 rounded-full px-5 text-[0.9375rem] font-semibold transition",
      "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta",
      active ? "bg-ink text-cream" : "text-ink-soft hover:text-ink",
    );

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 pb-24 md:pb-32">
        <header className="dn-page-head !pb-10 md:!pb-12">
          <div className="grid gap-8 md:grid-cols-12 md:items-end">
            <Reveal className="md:col-span-8">
              <p className="dn-eyebrow">Find a family</p>
              <h1 className="dn-page-title">새 가족을 기다리는 아이들</h1>
              <p className="dn-page-desc">
                전국 보호소의 공고를 한곳에 모았어요. 마음이 닿는 아이가 있다면 보호소에 전화로 입양이나 임시보호를
                문의해 주세요.
              </p>
            </Reveal>
            {viewMode === "all" && !loading && !error && (
              <Reveal delay={0.1} className="hidden md:col-span-4 md:block md:text-right">
                <p className="font-serif text-5xl leading-none text-ink md:text-6xl">
                  {apiTotalElements.toLocaleString()}
                  <span className="ml-1 text-2xl md:text-3xl">마리</span>
                </p>
                <p className="mt-2 text-sm text-ink-muted">
                  {hasFilter ? "조건에 맞는 아이들" : "지금 보호소에서 기다리는 아이들"}
                </p>
              </Reveal>
            )}
          </div>
        </header>

        <div className="mx-auto max-w-[76rem] px-6">
          {/* 탭 */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex rounded-full bg-ink/[0.06] p-1" role="group" aria-label="보기 방식">
              <button
                type="button"
                aria-pressed={viewMode === "all"}
                className={tabClass(viewMode === "all")}
                onClick={() => setViewMode("all")}
              >
                전체
              </button>
              <button
                type="button"
                aria-pressed={viewMode === "recommended"}
                className={tabClass(viewMode === "recommended")}
                onClick={openRecommended}
              >
                나를 위한 추천
                {!isAuthenticated && (
                  <>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                      <rect x="5" y="11" width="14" height="10" rx="2" />
                      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                    </svg>
                    <span className="sr-only">(로그인 필요)</span>
                  </>
                )}
              </button>
            </div>
            {viewMode === "all" && (
              <div className="flex items-center gap-3 text-sm text-ink-muted">
                {!loading && !error && (
                  <strong className="font-semibold text-ink md:hidden">{apiTotalElements.toLocaleString()}마리</strong>
                )}
                <label htmlFor="animal-sort" className="sr-only">
                  정렬
                </label>
                <select
                  id="animal-sort"
                  className="list-filter-select"
                  value={SORT_OPTIONS.some((o) => o.value === sort) ? sort : SORT_OPTIONS[0].value}
                  onChange={(e) => setSort(e.target.value)}
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* 검색·필터 (추천 보기는 선호도로만 거르므로 검색·필터를 숨긴다) */}
          {viewMode === "all" ? (
            <div className="mt-6 space-y-4 border-y border-ink/10 py-5">
              <div className="flex items-center gap-2">
                <ListSearch value={search} onChange={setSearch} placeholder="이름, 품종, 보호소로 검색" />
                <button
                  type="button"
                  className={clsx(
                    "inline-flex h-12 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition md:hidden",
                    filtersOpen || activeFilterCount > 0
                      ? "border-ink bg-ink text-cream"
                      : "border-ink/15 bg-cream-50 text-ink",
                  )}
                  aria-expanded={filtersOpen}
                  aria-controls="animal-filters"
                  onClick={() => setFiltersOpen((v) => !v)}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                    <path d="M4 6h16M7 12h10M10 18h4" />
                  </svg>
                  필터
                  {activeFilterCount > 0 && (
                    <span className="grid h-5 min-w-5 place-items-center rounded-full bg-terracotta px-1 text-xs text-white">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
              </div>
              <div id="animal-filters" className={clsx(!filtersOpen && "max-md:hidden")}>
                <FilterBar
                  groups={[
                    {
                      label: "종류",
                      type: "chips",
                      options: [
                        { value: "", label: "전체" },
                        { value: "DOG", label: speciesLabels.DOG },
                        { value: "CAT", label: speciesLabels.CAT },
                      ],
                      value: species,
                      onChange: (v) => setSpecies(v as "DOG" | "CAT" | ""),
                    },
                    {
                      label: "크기",
                      type: "chips",
                      options: [
                        { value: "", label: "전체" },
                        { value: "SMALL", label: sizeLabels.SMALL },
                        { value: "MEDIUM", label: sizeLabels.MEDIUM },
                        { value: "LARGE", label: sizeLabels.LARGE },
                      ],
                      value: size,
                      onChange: (v) => setSize(v as "SMALL" | "MEDIUM" | "LARGE" | ""),
                    },
                    {
                      label: "성별",
                      type: "chips",
                      options: [
                        { value: "", label: "전체" },
                        { value: "MALE", label: genderLabels.MALE },
                        { value: "FEMALE", label: genderLabels.FEMALE },
                      ],
                      value: gender,
                      onChange: (v) => setGender(v as "MALE" | "FEMALE" | ""),
                    },
                    {
                      label: "시/도",
                      options: REGION_SIDO_OPTIONS,
                      value: region,
                      onChange: setRegion,
                    },
                    ...(region
                      ? [
                          {
                            label: "시/군/구",
                            options: SIGUNGU_BY_SIDO[region] ?? [{ value: "", label: "전체" }],
                            value: sigungu,
                            onChange: setSigungu,
                          },
                        ]
                      : []),
                  ]}
                  onReset={hasFilter ? resetFilters : undefined}
                />
              </div>
            </div>
          ) : (
            preference && (
              <div className="mt-6 flex flex-col gap-4 rounded-3xl border border-ink/10 bg-cream-50 p-5 sm:flex-row sm:items-center sm:justify-between md:px-7">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-terracotta">나의 선호 조건</p>
                  <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="선호 조건">
                    {preferenceSummary.map((item) => (
                      <li key={item} className="rounded-full border border-ink/15 px-3 py-1 text-sm text-ink-soft">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <button
                  type="button"
                  data-pref-edit
                  className="toss-btn toss-btn-outline shrink-0 !py-2.5 text-sm"
                  onClick={() => setShowPreferenceModal(true)}
                >
                  조건 바꾸기
                </button>
              </div>
            )
          )}

          <section className="mt-10 md:mt-12" aria-label="동물 목록" aria-busy={loading}>
            {renderContent()}
          </section>
        </div>
      </main>
      <Footer />

      {showPreferenceModal &&
        createPortal(
          <PreferenceModal
            currentPreference={preference || undefined}
            onSave={handleSavePreference}
            onClose={() => setShowPreferenceModal(false)}
          />,
          document.body,
        )}
    </div>
  );
}
