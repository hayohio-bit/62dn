import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import type { AnimalResponse, AnimalStatsResponse } from "@/types/dto";
import { ageLabel, genderLabels, isTemporaryName } from "@/constants/animalLabels";
import NoticeBar from "@/components/animals/NoticeBar";
import TemporaryNameBadge from "@/components/animals/TemporaryNameBadge";
import QuickFind from "@/components/landing/QuickFind";
import StatsSourceLinks from "@/components/landing/StatsSourceLinks";
import { heroStats } from "@/constants/landingContent";
import { assetUrl } from "@/lib/assetUrl";

interface Props {
  /** 공고 기간이 가장 짧게 남은 동물 (없으면 카드 대신 안내 문구를 보여 준다) */
  featured?: AnimalResponse;
  /** 실시간 현황 (불러오기 전이거나 실패하면 null) */
  stats: AnimalStatsResponse | null;
}

const ease = [0.2, 0.8, 0.2, 1] as const;

/** 히어로 상단 알림 문구: 공고 중인 아이 수를 보여 준다 */
function liveMessage(stats: AnimalStatsResponse | null) {
  if (stats && stats.protectedCount > 0) return `지금 ${stats.protectedCount.toLocaleString()}마리가 가족을 기다려요`;
  return "전국 보호소의 공고를 한곳에 모았어요";
}

export default function HeroSection({ featured, stats }: Props) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const yBack = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -60]);
  const yFront = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -140]);

  return (
    <section ref={ref} className="relative overflow-hidden pt-[calc(var(--header-height)+2rem)]">
      {/* 배경 결: 아주 옅은 점 패턴 */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60 [background-image:radial-gradient(rgba(34,28,22,.05)_1px,transparent_1px)] [background-size:5px_5px]"
      />

      <div className="relative mx-auto grid max-w-[76rem] gap-12 px-6 pb-16 md:grid-cols-12 md:pb-24">
        <div className="md:col-span-6 md:pt-12">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease }}
            className="inline-flex items-center gap-2 rounded-full border border-ink/15 bg-cream-50/60 px-4 py-1.5 text-sm text-ink-soft"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-terracotta opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-terracotta" />
            </span>
            {liveMessage(stats)}
          </motion.p>

          <h1 className="dn-display mt-7 text-[3.25rem] leading-[1.08] sm:text-[4.25rem] lg:text-[4.75rem]">
            {["오늘, 한 생명의", "이름을 불러", "주세요."].map((line, i) => (
              <motion.span
                key={line}
                className="block"
                initial={{ opacity: 0, y: 36 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 0.1 + i * 0.12, ease }}
              >
                {i === 1 ? (
                  <>
                    이름을 <span className="text-terracotta">불러</span>
                  </>
                ) : (
                  line
                )}
              </motion.span>
            ))}
          </h1>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5, ease }}
          >
            <p className="mt-8 max-w-md text-lg leading-relaxed text-ink-soft">
              전국 보호소에서 새 가족을 기다리는 아이들을 한곳에서 만나고, 마음이 닿으면 보호소에 바로 연락하세요.
            </p>
            <div className="mt-9">
              <QuickFind />
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 px-2 text-sm font-semibold">
                <Link to="/animals" className="text-ink underline-offset-4 hover:text-terracotta hover:underline">
                  모든 아이들 보기 <span aria-hidden>→</span>
                </Link>
                <Link to="/guide/foster" className="text-ink-soft underline-offset-4 hover:text-terracotta hover:underline">
                  임시보호 알아보기 <span aria-hidden>→</span>
                </Link>
              </div>
            </div>

            <dl className="mt-14 grid max-w-lg grid-cols-3 gap-6 border-t border-ink/10 pt-8">
              {heroStats.map((s) => (
                <div key={s.label}>
                  <dt className="sr-only">{s.label}</dt>
                  <dd className="font-display font-display-strong text-3xl sm:text-4xl">
                    {s.value}
                    <span className="text-xl sm:text-2xl">{s.unit}</span>
                  </dd>
                  <dd className="mt-1 text-[0.8125rem] leading-snug text-ink-muted">{s.label}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-xs leading-relaxed text-ink-muted">
              <StatsSourceLinks />
            </p>
          </motion.div>
        </div>

        {/* 사진 콜라주 */}
        <div className="relative h-[520px] sm:h-[600px] md:col-span-6 md:h-[660px]">
          <motion.div
            style={{ y: yBack }}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.1, ease }}
            className="absolute right-0 top-0 h-[78%] w-[72%] overflow-hidden rounded-[999px_999px_28px_28px] shadow-lift"
          >
            <img
              src={assetUrl("images/landing/hero-dog.webp")}
              alt="꽃을 물고 앉아 있는 골든 리트리버"
              className="h-full w-full object-cover"
            />
          </motion.div>

          <motion.div
            style={{ y: yFront }}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.25, ease }}
            className="absolute bottom-0 left-0 h-[46%] w-[44%] overflow-hidden rounded-[1.75rem] ring-8 ring-cream"
          >
            <img src={assetUrl("images/landing/hero-cat.webp")} alt="턱시도 고양이" className="h-full w-full object-cover" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, rotate: -20, scale: 0.6 }}
            animate={{ opacity: 1, rotate: -8, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.6, ease }}
            className="absolute left-[6%] top-[8%] grid h-24 w-24 place-items-center rounded-full bg-sage-600 text-center font-display text-sm leading-tight text-white shadow-card"
          >
            <span>
              전국
              <br />
              <b className="text-lg">보호소 공고</b>
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.75, ease }}
            className="absolute bottom-[14%] right-[2%] w-[17rem]"
          >
            {featured ? (
              <Link
                to={`/animals/${featured.id}`}
                className="block rounded-2xl bg-white/90 p-5 shadow-lift backdrop-blur transition hover:-translate-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="flex min-w-0 items-center gap-2 font-display text-xl">
                    <span className="truncate">{featured.name || "이름 없음"}</span>
                    {isTemporaryName(featured) && <TemporaryNameBadge className="text-ink-muted" />}
                  </span>
                  <NoticeBar
                    onLight
                    className="shrink-0"
                    daysUntilExpiry={featured.daysUntilExpiry}
                    noticeStartDate={featured.noticeStartDate}
                    noticeEndDate={featured.noticeEndDate}
                  />
                </div>
                <p className="mt-1 text-sm text-ink-muted">
                  {[featured.breed, ageLabel(featured.age), featured.gender && genderLabels[featured.gender]]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-ink-soft">
                  {featured.description || `${featured.shelterName ?? "보호소"}에서 새 가족을 기다리고 있어요.`}
                </p>
                <p className="mt-3 text-xs font-semibold text-terracotta">공고 기간이 짧게 남은 아이 →</p>
              </Link>
            ) : (
              <div className="rounded-2xl bg-white/90 p-5 shadow-lift backdrop-blur">
                <p className="font-display text-xl">함께 찾아볼까요?</p>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  종류·지역·크기로 새 가족을 기다리는 아이들을 찾아볼 수 있어요.
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
