/**
 * 입양·임보 절차 안내 페이지 공통 레이아웃
 * 페이지 머리말 → (특정 동물에서 들어온 경우) 전화 안내 블록 → 전화 신청 안내 → 단계 목록 → 행동 유도
 */
import { useEffect, useState, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import clsx from "clsx";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import GuideCallBlock from "@/components/guide/GuideCallBlock";
import Reveal from "@/components/motion/Reveal";
import { animalApi } from "@/api";
import type { Animal } from "@/types/entities";

export interface GuideStep {
  title: string;
  desc: string;
  link?: { label: string; url: string };
}

interface GuideLayoutProps {
  kind: "adoption" | "foster";
  eyebrow: string;
  title: string;
  desc: string;
  notice: { title: string; body: string };
  steps: GuideStep[];
  /** 단계 목록 아래에 덧붙일 내용 */
  children?: ReactNode;
}

const kinds = [
  { key: "adoption", to: "/guide/adoption", label: "입양" },
  { key: "foster", to: "/guide/foster", label: "임시보호" },
] as const;

export default function GuideLayout({ kind, eyebrow, title, desc, notice, steps, children }: GuideLayoutProps) {
  const [searchParams] = useSearchParams();
  const animalIdParam = searchParams.get("animalId");
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [animalLoading, setAnimalLoading] = useState(false);

  useEffect(() => {
    const id = animalIdParam ? Number(animalIdParam) : NaN;
    if (Number.isNaN(id)) {
      setAnimal(null);
      return;
    }
    // 다른 동물로 바뀐 뒤 늦게 도착한 이전 응답은 버린다
    let cancelled = false;
    setAnimalLoading(true);
    animalApi
      .getById(id)
      .then((data) => {
        if (!cancelled) setAnimal(data);
      })
      .catch(() => {
        if (!cancelled) setAnimal(null);
      })
      .finally(() => {
        if (!cancelled) setAnimalLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [animalIdParam]);

  const query = animalIdParam ? `?animalId=${encodeURIComponent(animalIdParam)}` : "";
  const other = kinds.find((k) => k.key !== kind)!;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 pb-24 md:pb-32">
        <header className="dn-page-head">
          <Reveal>
            <nav aria-label="안내 종류" className="mb-8 flex w-fit rounded-full bg-ink/[0.06] p-1">
              {kinds.map((k) => (
                <Link
                  key={k.key}
                  to={`${k.to}${query}`}
                  aria-current={k.key === kind ? "page" : undefined}
                  className={clsx(
                    "inline-flex h-10 items-center rounded-full px-5 text-[0.9375rem] font-semibold transition",
                    k.key === kind ? "bg-ink text-cream" : "text-ink-soft hover:text-ink",
                  )}
                >
                  {k.label}
                </Link>
              ))}
            </nav>
            <p className="dn-eyebrow">{eyebrow}</p>
            <h1 className="dn-page-title">{title}</h1>
            <p className="dn-page-desc">{desc}</p>
          </Reveal>
        </header>

        <div className="mx-auto max-w-[76rem] px-6">
          <div className="grid items-start gap-6 md:grid-cols-12">
            {animalLoading && <div className="h-56 animate-pulse rounded-4xl bg-cream-200 md:col-span-7" aria-hidden />}
            {!animalLoading && animal && (
              <Reveal className="md:col-span-7">
                <GuideCallBlock animal={animal} type={kind} />
              </Reveal>
            )}
            <Reveal
              delay={0.05}
              className={clsx(animalLoading || animal ? "md:col-span-5" : "md:col-span-8")}
            >
              <div className="flex gap-4 rounded-3xl border border-terracotta/20 bg-terracotta-50 p-5 md:p-6">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-terracotta text-white" aria-hidden>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" />
                  </svg>
                </span>
                <div>
                  <p className="font-semibold text-ink">{notice.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-ink-soft">{notice.body}</p>
                </div>
              </div>
            </Reveal>
          </div>

          <ol className="mt-14 border-t border-ink/15 md:mt-20">
            {steps.map((s, i) => (
              <li key={s.title} className="border-b border-ink/15">
                <Reveal delay={Math.min(i, 3) * 0.05} className="grid gap-3 py-8 md:grid-cols-12 md:gap-6 md:py-10">
                  <span className="font-serif text-lg text-ink-faint md:col-span-1 md:pt-2" aria-hidden>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h2 className="font-serif text-3xl leading-tight text-ink md:col-span-4 md:text-[2.25rem]">
                    <span className="sr-only">{i + 1}단계. </span>
                    {s.title}
                  </h2>
                  <div className="md:col-span-7">
                    <p className="max-w-2xl leading-relaxed text-ink-soft">{s.desc}</p>
                    {s.link && (
                      <a
                        href={s.link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="toss-btn toss-btn-outline mt-5 !px-5 !py-2.5 text-sm"
                      >
                        {s.link.label} 바로가기 <span aria-hidden>↗</span>
                        <span className="sr-only">(새 창)</span>
                      </a>
                    )}
                  </div>
                </Reveal>
              </li>
            ))}
          </ol>

          {children}

          <Reveal className="mt-20 md:mt-28">
            <div className="relative overflow-hidden rounded-4xl bg-ink px-7 py-12 text-cream md:px-14 md:py-16">
              <div
                aria-hidden
                className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-terracotta/25 blur-3xl"
              />
              <div className="relative grid gap-8 md:grid-cols-12 md:items-end">
                <div className="md:col-span-7">
                  <p className="dn-eyebrow !text-terracotta-400">Next step</p>
                  <h2 className="mt-3 font-serif text-4xl leading-tight md:text-5xl">
                    마음이 닿는 아이를
                    <br />
                    찾아볼까요?
                  </h2>
                </div>
                <div className="flex flex-wrap gap-3 md:col-span-5 md:justify-end">
                  <Link to="/animals" className="toss-btn toss-btn-accent">
                    아이들 만나러 가기 <span aria-hidden>→</span>
                  </Link>
                  <Link
                    to={`${other.to}${query}`}
                    className="toss-btn border border-solid border-cream/25 px-6 py-[0.8125rem] text-cream hover:border-cream"
                  >
                    {other.label} 절차 보기
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </main>
      <Footer />
    </div>
  );
}
