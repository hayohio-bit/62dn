/**
 * 공고 기간이 얼마나 남았는지를 숫자 없이 막대로 보여 주기 위한 계산.
 * 남은 일수를 공고 기간 길이로 나눈 비율(0~1)과 단계, 스크린리더용 설명을 돌려준다.
 */
import { daysBetween } from "@/lib/koreanDate";

/** 공고 시작·종료일을 모를 때 쓰는 공고 기간 길이(일). 실제 공고는 7~17일이고 대부분 10~12일이다 (2026. 10. 31. 게시 데이터 2,201건) */
export const DEFAULT_NOTICE_DAYS = 10;

/** 공고 기간이 이보다 길어도 비율은 이 일수를 기준으로 계산한다. 긴 공고에서 많이 남았는데 막대가 짧게 보이는 것을 막는다 */
export const MAX_NOTICE_BASIS_DAYS = 15;

export type NoticeLevel = "plenty" | "half" | "short" | "ended";

export interface NoticeRemaining {
  /** 남은 비율 0~1. 막대 길이에 쓴다 */
  ratio: number;
  level: NoticeLevel;
  /** 숫자 없는 설명 (스크린리더·툴팁) */
  label: string;
}

const LABELS: Record<NoticeLevel, string> = {
  plenty: "공고 기간이 넉넉히 남아 있어요",
  half: "공고 기간이 절반쯤 남았어요",
  short: "공고 기간이 얼마 남지 않았어요",
  ended: "공고 기간이 끝났어요",
};

interface NoticeInput {
  daysUntilExpiry?: number | null;
  noticeStartDate?: string | null;
  noticeEndDate?: string | null;
}

/** 남은 일수를 모르면 null (막대를 그리지 않는다) */
export function noticeRemaining({ daysUntilExpiry, noticeStartDate, noticeEndDate }: NoticeInput): NoticeRemaining | null {
  if (daysUntilExpiry == null) return null;
  if (daysUntilExpiry < 0) return { ratio: 0, level: "ended", label: LABELS.ended };

  const length = noticeStartDate && noticeEndDate ? daysBetween(noticeStartDate, noticeEndDate) : 0;
  const total = length > 0 ? Math.min(length, MAX_NOTICE_BASIS_DAYS) : DEFAULT_NOTICE_DAYS;
  const ratio = Math.min(1, daysUntilExpiry / total);
  const level: NoticeLevel = ratio > 0.5 ? "plenty" : ratio > 0.2 ? "half" : "short";
  return { ratio, level, label: LABELS[level] };
}
