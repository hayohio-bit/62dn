import type { BoardType } from "@/types/entities";

/** 게시판 종류 표기 (목록 필터·배지·글쓰기 공통) */
export const BOARD_TYPES: BoardType[] = ["NOTICE", "FAQ", "FREE"];

export const boardTypeLabels: Record<BoardType, string> = {
  NOTICE: "공지",
  FAQ: "FAQ",
  FREE: "자유",
};

export const boardTypeTitles: Record<BoardType, string> = {
  NOTICE: "공지사항",
  FAQ: "자주 묻는 질문",
  FREE: "자유게시판",
};

export function isBoardType(value: string | null | undefined): value is BoardType {
  return value === "NOTICE" || value === "FAQ" || value === "FREE";
}

/** "2026.09.29" 형식 */
export function formatBoardDate(iso: string | undefined | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}.${mm}.${dd}`;
}

/** "2026.09.29 14:05" 형식 */
export function formatBoardDateTime(iso: string | undefined | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${formatBoardDate(iso)} ${hh}:${mi}`;
}
