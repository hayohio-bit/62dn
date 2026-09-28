import clsx from "clsx";
import type { BoardType } from "@/types/entities";
import { boardTypeLabels } from "./boardFormat";

const toneClass: Record<BoardType, string> = {
  NOTICE: "bg-terracotta text-white",
  FAQ: "bg-sage text-white",
  FREE: "border border-ink/25 text-ink-soft",
};

/** 게시판 종류 배지: 공지는 테라코타, FAQ는 세이지, 자유는 잉크 외곽선 */
export function BoardTypeBadge({ type, className }: { type: BoardType; className?: string }) {
  return (
    <span
      className={clsx(
        "inline-flex h-6 items-center rounded-full px-2.5 text-xs font-semibold leading-none",
        toneClass[type],
        className,
      )}
    >
      {boardTypeLabels[type]}
    </span>
  );
}

/** 상단 고정 표시 */
export function PinnedMark({ className }: { className?: string }) {
  return (
    <span className={clsx("inline-flex items-center gap-1.5 text-xs font-semibold text-terracotta", className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-terracotta" aria-hidden />
      고정
    </span>
  );
}

/** 작성자 이름 첫 글자를 담은 원형 아바타 */
export function NameAvatar({ name, size = "md" }: { name?: string | null; size?: "sm" | "md" | "lg" }) {
  const initial = (name || "익").trim().charAt(0);
  return (
    <span
      aria-hidden
      className={clsx(
        "grid shrink-0 place-items-center rounded-full bg-terracotta-50 font-serif text-terracotta-700",
        size === "sm" && "h-8 w-8 text-sm",
        size === "md" && "h-10 w-10 text-base",
        size === "lg" && "h-16 w-16 text-2xl",
      )}
    >
      {initial}
    </span>
  );
}
