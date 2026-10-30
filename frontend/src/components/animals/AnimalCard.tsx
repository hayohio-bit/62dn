/**
 * 동물 카드: 사진, 공고 마감 D-day, 이름·나이·품종·보호소, 찜 버튼
 * 동물 목록, 보호소 페이지, 동물 상세의 "같은 보호소의 다른 아이들"에서 함께 쓴다.
 */
import { Link } from "react-router-dom";
import clsx from "clsx";
import FavoriteButton from "@/components/animals/FavoriteButton";
import AnimalImageFallback from "@/components/animals/AnimalImageFallback";
import Reveal from "@/components/motion/Reveal";
import {
  ageLabel,
  ddayBadgeClass,
  formatDday,
  genderLabels,
  isTemporaryName,
  sizeLabels,
  speciesLabels,
} from "@/constants/animalLabels";
import TemporaryNameBadge from "@/components/animals/TemporaryNameBadge";
import type { Animal } from "@/types/entities";

export default function AnimalCard({
  animal,
  index,
  fromList = true,
}: {
  animal: Animal;
  index: number;
  /** 상세 화면의 "목록으로"가 뒤로 가기로 이 목록에 돌아오게 할지 여부 */
  fromList?: boolean;
}) {
  const dday = formatDday(animal.daysUntilExpiry);
  const meta = [
    ageLabel(animal.age) ?? "나이 미상",
    (animal.gender && genderLabels[animal.gender]) ?? "성별 미상",
    animal.size && sizeLabels[animal.size],
  ]
    .filter(Boolean)
    .join(" · ");
  const breed = [speciesLabels[animal.species], animal.breed].filter(Boolean).join(" · ");

  return (
    <Reveal delay={Math.min(index % 4, 3) * 0.06} y={20} className="relative">
      <Link
        to={`/animals/${animal.id}`}
        state={fromList ? { fromList: true } : undefined}
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
          <h3 className="flex min-w-0 items-center gap-2 font-display text-[1.375rem] leading-tight text-ink transition-colors group-hover:text-terracotta md:text-2xl">
            <span className="truncate">{animal.name || "이름 없음"}</span>
            {isTemporaryName(animal) && <TemporaryNameBadge className="text-ink-muted" />}
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
        <FavoriteButton
          animalId={animal.id}
          animalName={animal.name}
          size="md"
        />
      </div>
    </Reveal>
  );
}

export function AnimalCardSkeletonGrid({ count }: { count: number }) {
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
