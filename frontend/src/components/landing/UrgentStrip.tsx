import { useRef } from "react";
import { Link } from "react-router-dom";
import clsx from "clsx";
import type { AnimalResponse, AnimalStatsResponse } from "@/types/dto";
import AnimalImageFallback from "@/components/animals/AnimalImageFallback";
import Reveal from "@/components/motion/Reveal";
import { ddayTone, formatDday, genderLabels, speciesLabels } from "@/constants/animalLabels";

interface Props {
  animals: AnimalResponse[];
  stats: AnimalStatsResponse | null;
}

function Arrow({ dir }: { dir: "left" | "right" }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      {dir === "left" ? <path d="M15 5l-7 7 7 7" /> : <path d="M9 5l7 7-7 7" />}
    </svg>
  );
}

/** 공고 마감이 가까운 아이들 (어두운 띠, 가로 스크롤) */
export default function UrgentStrip({ animals, stats }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);

  if (animals.length === 0) return null;

  const scrollBy = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <section className="bg-ink py-20 text-cream md:py-24">
      <div className="mx-auto max-w-[76rem] px-6">
        <Reveal className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="dn-eyebrow !text-terracotta-400">Urgent</p>
            <h2 className="mt-3 font-display text-4xl leading-tight md:text-5xl">
              공고 마감이 가까운 아이들
            </h2>
            <p className="mt-3 max-w-xl text-cream/60">
              공고 기간이 지나 새 가족을 찾기 어려우면, 지자체 판단에 따라 인도적 처리(안락사)될 수 있어요. 한 번 더
              눈여겨봐 주세요.
            </p>
            {stats && stats.protectedCount > 0 && (
              <p className="mt-5 text-sm text-cream/80">
                지금 전국 <strong className="font-semibold text-cream">{stats.shelterCount.toLocaleString()}곳</strong>의
                보호소에서 <strong className="font-semibold text-cream">{stats.protectedCount.toLocaleString()}마리</strong>가
                가족을 기다리고 있어요.
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => scrollBy(-1)}
              aria-label="이전"
              className="grid h-11 w-11 place-items-center rounded-full border border-cream/20 text-cream/80 transition hover:border-cream hover:text-cream"
            >
              <Arrow dir="left" />
            </button>
            <button
              type="button"
              onClick={() => scrollBy(1)}
              aria-label="다음"
              className="grid h-11 w-11 place-items-center rounded-full border border-cream/20 text-cream/80 transition hover:border-cream hover:text-cream"
            >
              <Arrow dir="right" />
            </button>
            <Link to="/animals" className="ml-2 border-b border-cream/40 pb-0.5 text-[0.9375rem] text-cream/80 hover:border-cream hover:text-cream">
              전체 보기
            </Link>
          </div>
        </Reveal>
      </div>

      <div
        ref={trackRef}
        className="flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth px-6 pb-4 [scrollbar-width:none] scroll-pl-6 md:px-[max(1.5rem,calc((100vw_-_76rem)/2_+_1.5rem))] md:scroll-pl-[max(1.5rem,calc((100vw_-_76rem)/2_+_1.5rem))] [&::-webkit-scrollbar]:hidden"
      >
        {animals.map((a, i) => {
          const dday = formatDday(a.daysUntilExpiry);
          const tone = ddayTone(a.daysUntilExpiry);
          return (
            <Reveal key={a.id} delay={Math.min(i, 5) * 0.06} className="w-[15.5rem] shrink-0 snap-start md:w-[16.5rem]">
              <Link to={`/animals/${a.id}`} className="group block">
                <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-ink-soft/40">
                  {a.imageUrl ? (
                    <img
                      src={a.imageUrl}
                      alt={a.name || "보호 중인 동물"}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <AnimalImageFallback />
                  )}
                  {dday && (
                    <span
                      className={clsx(
                        "absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-bold",
                        tone === "urgent" ? "bg-terracotta text-white" : "bg-cream text-terracotta",
                      )}
                    >
                      {dday}
                    </span>
                  )}
                </div>
                <div className="mt-4 flex items-baseline justify-between gap-3">
                  <h3 className="font-display text-2xl">{a.name || "이름 없음"}</h3>
                  <span className="truncate text-sm text-cream/70">{a.shelterName}</span>
                </div>
                <p className="text-sm text-cream/60">
                  {[speciesLabels[a.species], a.breed, a.age != null ? `${a.age}살` : null, genderLabels[a.gender]]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </Link>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
