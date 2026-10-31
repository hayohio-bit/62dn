/** 동물 정보 표시용 라벨 */

export const speciesLabels: Record<string, string> = { DOG: "강아지", CAT: "고양이" };
export const sizeLabels: Record<string, string> = { SMALL: "소형", MEDIUM: "중형", LARGE: "대형" };
export const genderLabels: Record<string, string> = { MALE: "수컷", FEMALE: "암컷" };
export const statusLabels: Record<string, string> = {
  PROTECTED: "보호 중",
  FOSTERING: "임시보호 중",
  ADOPTED: "입양 완료",
};

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
