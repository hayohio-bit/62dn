import clsx from "clsx";
import { noticeRemaining, type NoticeLevel } from "@/lib/noticePeriod";

interface NoticeBarProps {
  daysUntilExpiry?: number | null;
  noticeStartDate?: string | null;
  noticeEndDate?: string | null;
  /** xs: 목록 안의 아주 작은 막대, sm: 카드 사진 위의 막대, md: 상세 화면의 막대 */
  size?: "xs" | "sm" | "md";
  /** 사진 위가 아니라 크림색 배경 위에 놓을 때 true (트랙을 어둡게 칠한다) */
  onLight?: boolean;
  className?: string;
}

/** 단계별 막대 색. 자극적인 빨강 대신 차분한 색을 쓰고, 남은 양은 길이로 전달한다 */
const FILL: Record<NoticeLevel, string> = {
  plenty: "bg-sage-600",
  half: "bg-honey",
  short: "bg-terracotta-500",
  ended: "bg-ink/30",
};

const SIZE = {
  xs: "h-1.5 w-12",
  sm: "h-2 w-16",
  md: "h-2.5 w-full max-w-[14rem]",
} as const;

/** 막대가 완전히 사라지지 않도록 남은 양이 아주 적어도 이 비율은 보여 준다 */
const MIN_VISIBLE_RATIO = 0.08;

/**
 * 공고 기간이 얼마나 남았는지 숫자 없이 줄어드는 막대로 보여 준다.
 * 정확한 일수보다 "얼마나 남았는지"의 느낌만 전달하고, 자세한 설명은 스크린리더·툴팁 문구로 준다.
 */
export default function NoticeBar({
  daysUntilExpiry,
  noticeStartDate,
  noticeEndDate,
  size = "sm",
  onLight = false,
  className,
}: NoticeBarProps) {
  const remaining = noticeRemaining({ daysUntilExpiry, noticeStartDate, noticeEndDate });
  if (!remaining) return null;

  const width = remaining.level === "ended" ? 0 : Math.max(MIN_VISIBLE_RATIO, remaining.ratio) * 100;

  return (
    <span
      role="img"
      aria-label={remaining.label}
      title={remaining.label}
      className={clsx(
        "block overflow-hidden rounded-full ring-1 ring-ink/10",
        onLight ? "bg-ink/10" : "bg-white/75 shadow-sm backdrop-blur-sm",
        SIZE[size],
        className,
      )}
    >
      <span
        className={clsx("block h-full rounded-full transition-[width] duration-500", FILL[remaining.level])}
        style={{ width: `${width}%` }}
      />
    </span>
  );
}
