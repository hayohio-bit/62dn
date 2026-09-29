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

/**
 * D-day 배지 색. 목록 카드·상세·랜딩·마이페이지에서 같은 기준으로 칠한다.
 * urgent(3일 이내)는 흰 글자 대비 4.5:1을 넘도록 terracotta-600 배경을 쓴다.
 */
export function ddayBadgeClass(days: number | null | undefined): string {
  if (days != null && days < 0) return "bg-ink/70 text-cream";
  const tone = ddayTone(days);
  if (tone === "urgent") return "bg-terracotta-600 text-white";
  if (tone === "soon") return "bg-cream-50 text-terracotta-700";
  return "bg-cream-50/90 text-ink";
}

/** 배지 없이 글자로만 D-day를 보여 줄 때의 색 */
export function ddayTextClass(days: number | null | undefined): string {
  return ddayTone(days) === "normal" ? "text-ink-muted" : "text-terracotta-700";
}

/** 공공데이터 공고에는 이름이 없어 서버가 임시 이름을 붙인다. 유기번호가 있으면 공공데이터 동물이다 */
export function isTemporaryName(animal: { publicApiAnimalId?: string | null }): boolean {
  return !!animal.publicApiAnimalId;
}

/** 나이 표기: 올해 태어난 아이(0살)는 "1살 미만" */
export function ageLabel(age: number | null | undefined): string | null {
  if (age == null) return null;
  return age <= 0 ? "1살 미만" : `${age}살`;
}

/**
 * 중성화 표기. 공공데이터는 "미상"을 "안 함"과 구분해 저장하지 않으므로,
 * 공공데이터 동물은 완료가 아니면 "보호소 확인 필요"로 보여 준다.
 */
export function neuteredLabel(animal: { neutered?: boolean | null; publicApiAnimalId?: string | null }): string {
  if (animal.neutered) return "완료";
  return isTemporaryName(animal) ? "보호소 확인 필요" : "안 함";
}
