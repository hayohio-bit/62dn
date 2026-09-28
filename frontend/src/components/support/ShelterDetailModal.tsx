/**
 * 보호소 상세보기 모달
 * - 보호소 이름, 주소, 전화번호, 이메일 표시
 * - "전화 걸기" / "길찾기" 버튼 제공
 * - ESC 키 / 오버레이 클릭 시 닫힘, 열릴 때 닫기 버튼으로 초점 이동
 */
import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { PublicShelterResponse } from "@/types/entities";

interface ShelterDetailModalProps {
  shelter: PublicShelterResponse;
  onClose: () => void;
}

export default function ShelterDetailModal({ shelter, onClose }: ShelterDetailModalProps) {
  const reduce = useReducedMotion();
  const closeRef = useRef<HTMLButtonElement>(null);
  // 부모가 다시 렌더링되며 onClose가 새로 만들어져도 아래 effect가 다시 실행되지 않도록 ref로 참조한다
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // ESC 키 닫기 + body 스크롤 잠금 + 초점 이동
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", onEsc);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onEsc);
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  // 카카오 지도 길찾기 URL 생성
  const kakaoMapUrl =
    shelter.latitude && shelter.longitude
      ? `https://map.kakao.com/link/to/${encodeURIComponent(shelter.name)},${shelter.latitude},${shelter.longitude}`
      : `https://map.kakao.com/link/search/${encodeURIComponent(shelter.address)}`;

  // 전화번호 정리 (숫자만)
  const cleanPhone = shelter.phone?.replace(/[^0-9]/g, "") || "";
  const region = [shelter.regionSido, shelter.regionSigungu].filter(Boolean).join(" ");

  const rows: { label: string; content: React.ReactNode }[] = [
    { label: "주소", content: shelter.address },
    ...(shelter.phone
      ? [
          {
            label: "전화",
            content: (
              <a href={`tel:${cleanPhone}`} className="font-semibold text-terracotta underline-offset-4 hover:underline">
                {shelter.phone}
              </a>
            ),
          },
        ]
      : []),
    ...(shelter.email
      ? [
          {
            label: "이메일",
            content: (
              <a href={`mailto:${shelter.email}`} className="break-all text-ink underline-offset-4 hover:underline">
                {shelter.email}
              </a>
            ),
          },
        ]
      : []),
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="shelter-modal-title"
    >
      {/* 오버레이 배경 */}
      <motion.div
        className="absolute inset-0 bg-ink/50 backdrop-blur-sm"
        onClick={onClose}
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        aria-hidden
      />

      {/* 모달 본체 */}
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
        className="relative flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-t-4xl bg-cream-50 shadow-lift sm:rounded-4xl"
      >
        {/* 헤더 */}
        <div className="flex items-start justify-between gap-4 px-6 pb-5 pt-7 sm:px-8">
          <div className="min-w-0">
            {region && (
              <span className="inline-block rounded-full bg-sage-50 px-2.5 py-1 text-xs font-medium text-sage-600">
                {region}
              </span>
            )}
            <h2 id="shelter-modal-title" className="mt-3 font-serif text-3xl leading-tight text-ink">
              {shelter.name}
            </h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-ink/15 text-ink-soft transition hover:border-ink hover:text-ink"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 본문 */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 sm:px-8">
          <dl className="border-t border-ink/10">
            {rows.map((r) => (
              <div key={r.label} className="flex gap-4 border-b border-ink/10 py-4">
                <dt className="w-14 shrink-0 text-sm text-ink-muted">{r.label}</dt>
                <dd className="text-[0.9375rem] leading-relaxed text-ink">{r.content}</dd>
              </div>
            ))}
          </dl>
          <p className="py-5 text-sm leading-relaxed text-ink-soft">
            봉사 일정과 필요한 기부 물품은 보호소마다 달라요. 방문하거나 물품을 보내기 전에 먼저 전화로 확인해 주세요.
          </p>
        </div>

        {/* 하단 액션 버튼 */}
        <div className="flex gap-3 border-t border-ink/10 px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5 sm:px-8">
          {shelter.phone && (
            <a href={`tel:${cleanPhone}`} className="toss-btn toss-btn-accent flex-1 !px-4">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" />
              </svg>
              전화 걸기
            </a>
          )}
          <a href={kakaoMapUrl} target="_blank" rel="noopener noreferrer" className="toss-btn toss-btn-outline flex-1 !px-4">
            카카오맵 길찾기 <span aria-hidden>↗</span>
            <span className="sr-only">(새 창)</span>
          </a>
        </div>
      </motion.div>
    </div>
  );
}
