/**
 * 전화 문의 블록
 * - GuideCallBlock: 절차 안내 페이지에서 특정 동물을 두고 "입양 상담 문의" / "임시보호 문의"를 안내한다.
 * - CallInquiryTip: 보호소에 전화할 때 말할 유기번호와 예시 문구 (상세 페이지와 함께 쓴다)
 */

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Animal } from "@/types/entities";
import AnimalImageFallback from "@/components/animals/AnimalImageFallback";
import { ageLabel, genderLabels, speciesLabels } from "@/constants/animalLabels";

type CallBlockType = "adoption" | "foster";

const titles: Record<CallBlockType, string> = {
  adoption: "입양 상담 문의하기",
  foster: "임시보호 문의하기",
};

/** 전화번호의 공백을 지워 tel: 링크에 쓴다 */
const telHref = (phone: string) => `tel:${phone.replace(/[^0-9+]/g, "")}`;

/** 보호소 전화 문의 시 참고 문구 (유기번호가 있으면 복사 가능한 예시 문구를 보여 준다) */
export function CallInquiryTip({ animal, className = "" }: { animal: Animal; className?: string }) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const phrase = animal.publicApiAnimalId
    ? `62댕냥 사이트 보고 연락드렸는데, 유기번호 ${animal.publicApiAnimalId} 해당 동물에 대해 문의드려도 될까요?`
    : null;

  useEffect(() => {
    if (copyState === "idle") return;
    const id = setTimeout(() => setCopyState("idle"), 2500);
    return () => clearTimeout(id);
  }, [copyState]);

  const copy = () => {
    if (!phrase) return;
    // http 환경 등 클립보드 API를 쓸 수 없는 브라우저에서는 실패를 알린다
    if (!navigator.clipboard) {
      setCopyState("failed");
      return;
    }
    navigator.clipboard.writeText(phrase).then(
      () => setCopyState("copied"),
      () => setCopyState("failed"),
    );
  };

  return (
    <div className={`rounded-2xl border border-ink/10 bg-cream/60 p-5 ${className}`.trim()}>
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-muted">전화 문의 시 참고</p>
      {phrase ? (
        <>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            보호소에서 아이를 찾을 수 있도록 <strong className="font-semibold text-ink">유기번호</strong>를 말씀해 주세요.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-ink/15 bg-white px-3 py-1 font-mono text-sm text-ink">
              유기번호 {animal.publicApiAnimalId}
            </span>
            <button
              type="button"
              onClick={copy}
              className="rounded-full px-3 py-1 text-sm font-semibold text-terracotta transition hover:bg-terracotta-50"
            >
              예시 문구 복사
            </button>
            <span role="status" aria-live="polite" className="text-xs text-ink-muted">
              {copyState === "copied" && "복사했어요"}
              {copyState === "failed" && "복사하지 못했어요. 아래 문구를 참고해 주세요."}
            </span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">&ldquo;{phrase}&rdquo;</p>
        </>
      ) : (
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          전화하실 때 품종, 크기, 보호소 공고에서 본 특징을 함께 말씀해 주시면 빠르게 찾을 수 있어요.
        </p>
      )}
    </div>
  );
}

interface GuideCallBlockProps {
  animal: Animal;
  type: CallBlockType;
}

export default function GuideCallBlock({ animal, type }: GuideCallBlockProps) {
  const phones = Array.from(new Set([animal.chargePhone, animal.shelterPhone].filter((p): p is string => !!p)));
  const meta = [speciesLabels[animal.species], animal.breed, ageLabel(animal.age), animal.gender && genderLabels[animal.gender]]
    .filter(Boolean)
    .join(" · ");

  return (
    <section
      aria-labelledby="guide-call-title"
      className="overflow-hidden rounded-4xl border border-ink/10 bg-cream-50 shadow-card"
    >
      <div className="grid gap-0 sm:grid-cols-[11rem_1fr]">
        <Link to={`/animals/${animal.id}`} className="group relative block aspect-[16/10] overflow-hidden bg-cream-200 sm:aspect-auto">
          {animal.imageUrl ? (
            <img
              src={animal.imageUrl}
              alt={`${animal.name || "보호 중인 동물"} 사진`}
              className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
            />
          ) : (
            <AnimalImageFallback />
          )}
        </Link>
        <div className="p-6 sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-terracotta">{titles[type]}</p>
          <h2 id="guide-call-title" className="mt-2 font-display text-3xl leading-tight text-ink">
            {animal.name || "이름 없음"}
          </h2>
          {meta && <p className="mt-1 text-sm text-ink-muted">{meta}</p>}
          {animal.shelterName && <p className="mt-3 text-sm text-ink-soft">{animal.shelterName}</p>}

          {phones.length > 0 ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {phones.map((phone, i) => (
                <a
                  key={phone}
                  href={telHref(phone)}
                  className={`toss-btn ${i === 0 ? "toss-btn-accent" : "toss-btn-outline"} !py-3 text-sm`}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" />
                  </svg>
                  {phone === animal.chargePhone && phone !== animal.shelterPhone ? "담당자" : "보호소"} {phone}
                </a>
              ))}
            </div>
          ) : (
            <p className="mt-5 text-sm text-ink-soft">등록된 연락처가 없어요. 관할 지자체에 문의해 주세요.</p>
          )}

          <CallInquiryTip animal={animal} className="mt-5" />
        </div>
      </div>
    </section>
  );
}
