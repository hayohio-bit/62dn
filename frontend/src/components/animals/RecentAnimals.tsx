/**
 * 최근 본 아이들: 상세 화면에서 본 동물을 사진과 이름으로 한 줄에 보여 준다.
 * 기록이 없으면 아무것도 표시하지 않는다.
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import clsx from "clsx";
import AnimalImageFallback from "@/components/animals/AnimalImageFallback";
import { ddayTone, formatDday } from "@/constants/animalLabels";
import { clearRecentAnimals, daysUntil, getRecentAnimals } from "@/lib/recentAnimals";

export default function RecentAnimals({ className = "" }: { className?: string }) {
  const [items, setItems] = useState(getRecentAnimals);

  if (items.length === 0) return null;

  return (
    <section aria-labelledby="recent-animals" className={className}>
      <div className="flex items-center justify-between gap-4">
        <h2 id="recent-animals" className="text-sm font-semibold text-ink">
          최근 본 아이들
        </h2>
        <button
          type="button"
          className="text-xs font-medium text-ink-muted underline-offset-4 transition hover:text-ink hover:underline"
          onClick={() => {
            clearRecentAnimals();
            setItems([]);
          }}
        >
          기록 지우기
        </button>
      </div>
      <ul className="-mx-6 mt-3 flex gap-4 overflow-x-auto px-6 pb-2 [scrollbar-width:thin]">
        {items.map((a) => {
          const days = a.noticeEndDate ? daysUntil(a.noticeEndDate) : null;
          const dday = formatDday(days);
          return (
            <li key={a.id} className="w-[4.5rem] shrink-0">
              <Link
                to={`/animals/${a.id}`}
                // 동물 목록 위에 있으므로 상세의 "목록으로"가 뒤로 가기로 필터·페이지를 유지하게 한다
                state={{ fromList: true }}
                className="group block text-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
              >
                <span className="relative block h-[4.5rem] w-[4.5rem] overflow-hidden rounded-full bg-cream-200 ring-1 ring-ink/10 transition group-hover:ring-2 group-hover:ring-terracotta">
                  {a.imageUrl ? (
                    <img src={a.imageUrl} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                  ) : (
                    <AnimalImageFallback />
                  )}
                </span>
                <span className="mt-2 block truncate text-sm text-ink group-hover:text-terracotta">{a.name || "이름 없음"}</span>
                {dday && (
                  <span
                    className={clsx(
                      "block text-[0.6875rem] font-semibold tabular-nums",
                      ddayTone(days) === "normal" ? "text-ink-muted" : "text-terracotta",
                    )}
                  >
                    {dday}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
