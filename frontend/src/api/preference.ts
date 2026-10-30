/**
 * 선호도 API 모듈. 백엔드 대신 브라우저 저장소(선호 조건)와 정적 스냅샷(추천)을 쓴다.
 */
import { recommendAnimals } from "@/data/animalQueries";
import { loadSnapshot } from "@/data/snapshot";
import { koreanToday } from "@/lib/koreanDate";
import { preferenceStore, savePreference } from "@/lib/preference";
import type { PreferenceRequest } from "@/types/dto";

export const preferenceApi = {
  getMy: async () => preferenceStore.snapshot(),

  update: async (data: PreferenceRequest) => savePreference(data),

  /** 저장된 선호 조건에 맞는 동물. 조건이 없으면 빈 목록 */
  getRecommendedAnimals: async (page = 0, size = 12) =>
    recommendAnimals(await loadSnapshot(), preferenceStore.snapshot(), { page, size }, koreanToday()),
};
