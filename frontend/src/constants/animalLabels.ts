/** 동물 정보 표시용 라벨과 공고 마감(D-day) 표기 */

export const speciesLabels: Record<string, string> = { DOG: "강아지", CAT: "고양이" };
export const sizeLabels: Record<string, string> = { SMALL: "소형", MEDIUM: "중형", LARGE: "대형" };
export const genderLabels: Record<string, string> = { MALE: "수컷", FEMALE: "암컷" };
export const statusLabels: Record<string, string> = {
  PROTECTED: "보호 중",
  FOSTERING: "임시보호 중",
  ADOPTED: "입양 완료",
};

/** 공고 마감까지 남은 일수를 "D-3", "D-Day", "마감"으로 표기한다. 값이 없으면 null */
export function formatDday(days: number | null | undefined): string | null {
  if (days === null || days === undefined) return null;
  if (days < 0) return "마감";
  if (days === 0) return "D-Day";
  return `D-${days}`;
}

/** 마감이 가까울수록 강조한다: 3일 이내 urgent, 7일 이내 soon */
export function ddayTone(days: number | null | undefined): "urgent" | "soon" | "normal" {
  if (days === null || days === undefined) return "normal";
  if (days <= 3) return "urgent";
  if (days <= 7) return "soon";
  return "normal";
}
