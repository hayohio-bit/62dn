import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import clsx from "clsx";
import { animalApi } from "@/api";
import { useFavoriteIds } from "@/hooks/useFavoriteIds";
import type { Animal } from "@/types/entities";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import KakaoMap from "@/components/map/KakaoMap";
import FavoriteButton from "@/components/animals/FavoriteButton";
import ShareButton from "@/components/animals/ShareButton";
import AnimalImageFallback from "@/components/animals/AnimalImageFallback";
import { CallInquiryTip } from "@/components/guide/GuideCallBlock";
import Reveal from "@/components/motion/Reveal";
import MoreAnimals from "@/components/animals/MoreAnimals";
import {
  ddayTone,
  formatDday,
  genderLabels,
  sizeLabels,
  speciesLabels,
  statusLabels,
} from "@/constants/animalLabels";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

const ease = [0.2, 0.8, 0.2, 1] as const;

const telHref = (phone: string) => `tel:${phone.replace(/[^0-9+]/g, "")}`;

/** "2026-09-30" → "2026. 9. 30." */
const formatDate = (iso?: string) => {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("ko-KR");
};

/** 이름 끝 글자의 받침 유무에 따라 조사를 고른다 (예: 호두를, 먹물을) */
const withJosa = (word: string, withBatchim: string, withoutBatchim: string) => {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  if (code < 0 || code > 11171) return `${word}${withoutBatchim}`;
  return `${word}${code % 28 === 0 ? withoutBatchim : withBatchim}`;
};

function PhoneIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" />
    </svg>
  );
}

function ImageLightbox({ src, alt, caption, onClose }: { src: string; alt: string; caption: string; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // ESC로 닫기, 배경 스크롤 잠금, 열릴 때 닫기 버튼으로 초점 이동
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/90 p-4 backdrop-blur-sm md:p-10"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="사진 크게 보기"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      <button
        ref={closeRef}
        type="button"
        onClick={onClose}
        aria-label="닫기"
        className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] grid h-11 w-11 place-items-center rounded-full border border-cream/25 text-cream transition hover:border-cream hover:bg-cream/10 md:right-8 md:top-8"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
      <motion.figure
        className="flex max-h-full max-w-5xl flex-col items-center"
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        transition={{ duration: 0.35, ease }}
        onClick={(e) => e.stopPropagation()}
      >
        <img src={src} alt={alt} className="max-h-[80vh] max-w-full rounded-3xl object-contain" />
        <figcaption className="mt-4 font-serif text-xl text-cream">{caption}</figcaption>
      </motion.figure>
    </motion.div>
  );
}

function DetailSkeleton() {
  return (
    <div className="mx-auto grid max-w-[76rem] animate-pulse gap-10 px-6 pt-[calc(var(--header-height)+2.5rem)] md:grid-cols-12" aria-hidden>
      <div className="aspect-square rounded-4xl bg-cream-200 md:col-span-7" />
      <div className="space-y-4 md:col-span-5 md:pt-6">
        <div className="h-4 w-24 rounded-full bg-cream-200" />
        <div className="h-14 w-2/3 rounded-full bg-cream-200" />
        <div className="h-4 w-1/2 rounded-full bg-cream-200" />
        <div className="h-40 rounded-3xl bg-cream-200/70" />
      </div>
    </div>
  );
}

export default function AnimalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const reduce = useReducedMotion();
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [loading, setLoading] = useState(true);
  const { favoriteIds, toggle: toggleFavorite } = useFavoriteIds();
  const [imageModalOpen, setImageModalOpen] = useState(false);
  // 목록에서 들어왔으면 뒤로 가기로 돌아가 필터·페이지·스크롤 위치를 그대로 유지한다
  const cameFromList = (location.state as { fromList?: boolean } | null)?.fromList === true;
  // 탭 제목 예: "보리 · 믹스견 2살 | 62댕냥"
  useDocumentTitle(
    animal
      ? [animal.name || "이름 없음", [animal.breed, animal.age != null ? `${animal.age}살` : null].filter(Boolean).join(" ")]
          .filter(Boolean)
          .join(" · ")
      : null,
  );

  useEffect(() => {
    if (!id) return;
    // 다른 동물로 이동한 뒤 늦게 도착한 이전 응답은 무시한다.
    let cancelled = false;
    const loadAnimal = async () => {
      try {
        setLoading(true);
        const data = await animalApi.getById(Number(id));
        if (!cancelled) setAnimal(data);
      } catch {
        if (cancelled) return;
        alert("동물 정보를 불러오는데 실패했습니다.");
        navigate("/animals");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadAnimal();
    return () => {
      cancelled = true;
    };
  }, [id, navigate]);


  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 pb-24" aria-busy="true">
          <p className="sr-only">동물 정보를 불러오는 중입니다.</p>
          <DetailSkeleton />
        </main>
        <Footer />
      </div>
    );
  }

  if (!animal) return null;

  const name = animal.name || "이름 없음";
  const dday = formatDday(animal.daysUntilExpiry);
  const tone = ddayTone(animal.daysUntilExpiry);
  const expired = animal.daysUntilExpiry != null && animal.daysUntilExpiry < 0;
  // 담당자 번호와 보호소 번호가 같은 경우가 많으므로 한 번만 보여 준다
  const phones = Array.from(new Set([animal.chargePhone, animal.shelterPhone].filter((p): p is string => !!p)));
  const phoneLabel = (phone: string) => (phone === animal.shelterPhone ? "보호소" : "담당자");
  const hasShelterInfo = !!(
    animal.shelterName || animal.shelterAddress || animal.shelterPhone || animal.orgName || animal.chargeName || animal.chargePhone
  );
  const hasLocation = !!animal.shelterAddress || (animal.shelterLatitude != null && animal.shelterLongitude != null);

  const facts: { label: string; value: string }[] = [
    { label: "종류", value: speciesLabels[animal.species] ?? "미상" },
    { label: "품종", value: animal.breed || "미상" },
    { label: "나이", value: animal.age != null ? `${animal.age}살` : "미상" },
    { label: "성별", value: genderLabels[animal.gender] ?? "미상" },
    { label: "크기", value: sizeLabels[animal.size] ?? "미상" },
    { label: "중성화", value: animal.neutered ? "완료" : "안 함" },
  ];
  const noticeStart = formatDate(animal.noticeStartDate);
  const noticeEnd = formatDate(animal.noticeEndDate);
  const description = animal.description?.replace(/\s*\[특징\]/g, "\n\n[특징]");

  const backLink = cameFromList ? (
    <button type="button" onClick={() => navigate(-1)} className="group inline-flex items-center gap-2 text-sm font-medium text-ink-soft transition hover:text-ink">
      <span aria-hidden className="transition group-hover:-translate-x-0.5">←</span> 목록으로
    </button>
  ) : (
    <Link to="/animals" className="group inline-flex items-center gap-2 text-sm font-medium text-ink-soft transition hover:text-ink">
      <span aria-hidden className="transition group-hover:-translate-x-0.5">←</span> 목록으로
    </Link>
  );

  return (
    <div className={clsx("flex min-h-screen flex-col", phones.length > 0 && "max-md:pb-[4.75rem]")}>
      <Header />
      <main className="flex-1 pb-24 md:pb-32">
        <div className="mx-auto max-w-[76rem] px-6 pt-[calc(var(--header-height)+1.75rem)] md:pt-[calc(var(--header-height)+2.5rem)]">
          <nav aria-label="이동" className="mb-6 md:mb-8">
            {backLink}
          </nav>

          <div className="grid gap-10 md:grid-cols-12 lg:gap-16">
            {/* 사진 */}
            <motion.div
              className="md:sticky md:top-[calc(var(--header-height)+1.5rem)] md:col-span-7 md:self-start"
              initial={reduce ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease }}
            >
              <div className="relative aspect-square overflow-hidden rounded-4xl bg-cream-200 shadow-card">
                {animal.imageUrl ? (
                  <button
                    type="button"
                    data-zoom-trigger
                    onClick={() => setImageModalOpen(true)}
                    className="group block h-full w-full cursor-zoom-in focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-terracotta"
                    aria-label={`${name} 사진 크게 보기`}
                  >
                    <img
                      src={animal.imageUrl}
                      alt={`${name} 사진`}
                      className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.03]"
                    />
                    <span className="absolute bottom-4 right-4 inline-flex items-center gap-1.5 rounded-full bg-cream-50/90 px-3.5 py-2 text-xs font-semibold text-ink shadow-card backdrop-blur transition group-hover:bg-white">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                        <circle cx="11" cy="11" r="7" />
                        <path d="m20 20-3.5-3.5M11 8v6M8 11h6" />
                      </svg>
                      크게 보기
                    </span>
                  </button>
                ) : (
                  <AnimalImageFallback />
                )}
                {dday && (
                  <span
                    className={clsx(
                      "pointer-events-none absolute left-4 top-4 rounded-full px-3.5 py-1.5 text-sm font-bold tabular-nums shadow-sm",
                      expired ? "bg-ink/70 text-cream" : tone === "urgent" ? "bg-terracotta text-white" : "bg-cream-50 text-terracotta",
                    )}
                  >
                    {dday}
                    <span className="sr-only"> 공고 마감</span>
                  </span>
                )}
              </div>
            </motion.div>

            {/* 정보 */}
            <motion.div
              className="md:col-span-5"
              initial={reduce ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="dn-eyebrow">{statusLabels[animal.status] ?? "보호 중"}</p>
                  <h1 className="dn-display mt-3 break-words text-5xl md:text-6xl">{name}</h1>
                </div>
                <div className="mt-1 flex shrink-0 gap-2">
                  <ShareButton
                    title={`${name} | 62댕냥`}
                    text={`${withJosa(name, "이", "가")} 새 가족을 기다리고 있어요.${dday && !expired ? ` 공고 마감 ${dday}` : ""}`}
                  />
                  <FavoriteButton
                    animalId={animal.id}
                    isFavorited={favoriteIds.includes(animal.id)}
                    onToggle={(added) => toggleFavorite(animal.id, added)}
                    size="lg"
                    className="border border-ink/10"
                  />
                </div>
              </div>
              <p className="mt-3 text-ink-soft">
                {[animal.breed, animal.age != null ? `${animal.age}살` : null, genderLabels[animal.gender]].filter(Boolean).join(" · ")}
              </p>

              {(noticeStart || noticeEnd) && (
                <p className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-muted">
                  <span>
                    공고 기간 {noticeStart} – {noticeEnd}
                  </span>
                  {dday && !expired && (
                    <span className={clsx("font-semibold", tone === "normal" ? "text-ink-soft" : "text-terracotta")}>
                      · 마감까지 {animal.daysUntilExpiry === 0 ? "오늘" : `${animal.daysUntilExpiry}일`}
                    </span>
                  )}
                  {expired && <span className="font-semibold text-ink-soft">· 공고 기간이 끝났어요</span>}
                </p>
              )}

              <dl className="mt-8 grid grid-cols-2 border-t border-ink/10">
                {facts.map((f) => (
                  <div key={f.label} className="border-b border-ink/10 py-3.5 odd:pr-4 even:border-l even:pl-5">
                    <dt className="text-xs text-ink-muted">{f.label}</dt>
                    <dd className="mt-0.5 text-[0.9375rem] text-ink">{f.value}</dd>
                  </div>
                ))}
              </dl>

              {description && (
                <div className="mt-8">
                  <h2 className="font-serif text-2xl text-ink">{withJosa(name, "을", "를")} 소개해요</h2>
                  <p className="mt-3 whitespace-pre-wrap leading-relaxed text-ink-soft">{description}</p>
                </div>
              )}

              {/* 연락 */}
              <div className="mt-8 rounded-3xl bg-ink p-6 text-cream md:p-7">
                <p className="font-serif text-2xl leading-snug">
                  {withJosa(name, "과", "와")} 가족이 되고 싶다면
                  <br />
                  보호소에 전화해 주세요
                </p>
                <p className="mt-2 text-sm leading-relaxed text-cream/60">
                  입양·임시보호 신청과 방문 예약은 보호소에서 전화로 받고 있어요.
                </p>
                {phones.length > 0 ? (
                  <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    {phones.map((phone, i) => (
                      <a
                        key={phone}
                        href={telHref(phone)}
                        className={clsx(
                          "toss-btn text-[0.9375rem]",
                          i === 0 ? "toss-btn-accent !shadow-none" : "border border-solid border-cream/25 px-5 py-3 text-cream hover:border-cream",
                        )}
                      >
                        <PhoneIcon />
                        {phoneLabel(phone)} {phone}
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="mt-5 text-sm text-cream/70">등록된 연락처가 없어요. 관할 지자체에 문의해 주세요.</p>
                )}
                <div className="mt-6 grid grid-cols-2 gap-2 border-t border-cream/15 pt-5">
                  <Link
                    to={`/guide/adoption?animalId=${animal.id}`}
                    className="group flex items-center justify-between rounded-2xl px-1 py-1 text-sm font-semibold text-cream/85 transition hover:text-cream"
                  >
                    입양 절차 안내
                    <span aria-hidden className="grid h-8 w-8 place-items-center rounded-full border border-cream/25 transition group-hover:border-terracotta group-hover:bg-terracotta">
                      →
                    </span>
                  </Link>
                  <Link
                    to={`/guide/foster?animalId=${animal.id}`}
                    className="group flex items-center justify-between rounded-2xl px-1 py-1 text-sm font-semibold text-cream/85 transition hover:text-cream sm:pl-4"
                  >
                    임보 절차 안내
                    <span aria-hidden className="grid h-8 w-8 place-items-center rounded-full border border-cream/25 transition group-hover:border-terracotta group-hover:bg-terracotta">
                      →
                    </span>
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>

          {/* 보호소 */}
          {hasShelterInfo && (
            <Reveal className="mt-20 border-t border-ink/15 pt-12 md:mt-28 md:pt-16">
              <div className="grid gap-10 md:grid-cols-12 lg:gap-16">
                <div className="md:col-span-5">
                  <p className="dn-eyebrow">Shelter</p>
                  <h2 className="mt-3 font-serif text-3xl leading-tight text-ink md:text-4xl">
                    {animal.shelterName || "보호소 정보"}
                  </h2>
                  {animal.shelterId && (
                    <Link
                      to={`/shelters/${animal.shelterId}`}
                      className="group mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-terracotta underline-offset-4 hover:underline"
                    >
                      이 보호소의 아이들 모두 보기
                      <span aria-hidden className="transition group-hover:translate-x-0.5">→</span>
                    </Link>
                  )}
                  <dl className="mt-6 border-t border-ink/10 text-[0.9375rem]">
                    {animal.orgName && (
                      <div className="flex gap-4 border-b border-ink/10 py-3.5">
                        <dt className="w-20 shrink-0 text-sm text-ink-muted">관할기관</dt>
                        <dd className="text-ink">{animal.orgName}</dd>
                      </div>
                    )}
                    {animal.chargeName && (
                      <div className="flex gap-4 border-b border-ink/10 py-3.5">
                        <dt className="w-20 shrink-0 text-sm text-ink-muted">담당자</dt>
                        <dd className="text-ink">{animal.chargeName}</dd>
                      </div>
                    )}
                    {animal.shelterAddress && (
                      <div className="flex gap-4 border-b border-ink/10 py-3.5">
                        <dt className="w-20 shrink-0 text-sm text-ink-muted">주소</dt>
                        <dd className="text-ink">{animal.shelterAddress}</dd>
                      </div>
                    )}
                    {phones.map((phone) => (
                      <div key={phone} className="flex gap-4 border-b border-ink/10 py-3.5">
                        <dt className="w-20 shrink-0 text-sm text-ink-muted">{phoneLabel(phone)} 전화</dt>
                        <dd>
                          <a href={telHref(phone)} className="font-semibold text-terracotta underline-offset-4 hover:underline">
                            {phone}
                          </a>
                        </dd>
                      </div>
                    ))}
                  </dl>
                  {phones.length > 0 && <CallInquiryTip animal={animal} className="mt-6" />}
                </div>

                {hasLocation && (
                  <div className="md:col-span-7">
                    <KakaoMap
                      address={animal.shelterAddress ?? undefined}
                      latitude={animal.shelterLatitude ?? undefined}
                      longitude={animal.shelterLongitude ?? undefined}
                      height={360}
                      className="w-full"
                    />
                    <div className="mt-4 flex flex-wrap gap-2">
                      {animal.shelterAddress && (
                        <a
                          href={`https://map.kakao.com/link/search/${encodeURIComponent(animal.shelterAddress)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="toss-btn toss-btn-outline !px-4 !py-2.5 text-sm"
                        >
                          카카오맵에서 보기 <span aria-hidden>↗</span>
                          <span className="sr-only">(새 창)</span>
                        </a>
                      )}
                      {animal.shelterLatitude != null && animal.shelterLongitude != null && animal.shelterName && (
                        <a
                          href={`https://map.kakao.com/link/to/${encodeURIComponent(animal.shelterName)},${animal.shelterLatitude},${animal.shelterLongitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="toss-btn toss-btn-outline !px-4 !py-2.5 text-sm"
                        >
                          길찾기 <span aria-hidden>↗</span>
                          <span className="sr-only">(새 창)</span>
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Reveal>
          )}

          <MoreAnimals animal={animal} favoriteIds={favoriteIds} onFavoriteToggle={toggleFavorite} />
        </div>
      </main>
      <Footer />

      {/* 모바일: 화면 아래에 전화 버튼을 고정해 어디서든 바로 연락할 수 있게 한다 */}
      {phones.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-ink/10 bg-cream-50/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur md:hidden">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate font-serif text-lg leading-tight text-ink">{name}</p>
              <p className="truncate text-xs text-ink-muted">{animal.shelterName}</p>
            </div>
            <a href={telHref(phones[0])} className="toss-btn toss-btn-accent !px-5 !py-3 text-[0.9375rem]">
              <PhoneIcon />
              전화 문의
            </a>
          </div>
        </div>
      )}

      <AnimatePresence>
        {imageModalOpen && animal.imageUrl && (
          <ImageLightbox src={animal.imageUrl} alt={`${name} 사진`} caption={name} onClose={() => setImageModalOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
