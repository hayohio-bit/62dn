import type { ReactNode } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Reveal from "@/components/motion/Reveal";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export interface InfoSection {
  /** 목차 없이도 주소로 바로 이동할 수 있게 하는 앵커 */
  id: string;
  title: string;
  children: ReactNode;
}

interface InfoPageProps {
  eyebrow: string;
  title: string;
  intro: string;
  /** 시행일·기준일 (예: "2026. 11. 1.") */
  effectiveDate: string;
  sections: InfoSection[];
}

/** 개인정보 처리방침·이용 안내처럼 문서형 페이지의 공통 레이아웃 */
export default function InfoPage({ eyebrow, title, intro, effectiveDate, sections }: InfoPageProps) {
  useDocumentTitle(title);
  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <Header />
      <main className="flex-1">
        <Reveal className="dn-page-head">
          <p className="dn-eyebrow">{eyebrow}</p>
          <h1 className="dn-page-title">{title}</h1>
          <p className="dn-page-desc">{intro}</p>
          <p className="mt-4 text-sm text-ink-muted">
            시행일: <span className="whitespace-nowrap">{effectiveDate}</span>
          </p>
        </Reveal>

        <div className="mx-auto max-w-3xl space-y-12 px-6 pb-24">
          {sections.map((s, i) => (
            <section key={s.id} id={s.id} aria-labelledby={`${s.id}-title`} className="scroll-mt-24">
              <h2 id={`${s.id}-title`} className="font-display text-2xl text-ink md:text-3xl">
                <span className="mr-2 text-terracotta">{i + 1}.</span>
                {s.title}
              </h2>
              <div className="mt-4 space-y-4 leading-relaxed text-ink-soft">{s.children}</div>
            </section>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}

/** 문서형 페이지의 표. 모바일에서는 가로로 스크롤한다 */
export function InfoTable({ caption, head, rows }: { caption: string; head: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-ink/10 bg-cream-50">
      <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-ink/10 bg-cream-200/60 text-ink">
            {head.map((h) => (
              <th key={h} scope="col" className="px-4 py-3 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className="border-b border-ink/5 align-top last:border-b-0">
              {row.map((cell, i) =>
                i === 0 ? (
                  <th key={i} scope="row" className="px-4 py-3 font-medium text-ink">
                    {cell}
                  </th>
                ) : (
                  <td key={i} className="px-4 py-3">
                    {cell}
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** 새 창으로 여는 외부 링크 */
export function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-ink">
      {children}
      <span className="sr-only"> (새 창)</span>
    </a>
  );
}
