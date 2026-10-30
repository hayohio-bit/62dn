/**
 * Animal API 모듈
 * 동물 목록·상세·마감 임박·실시간 현황. 백엔드 대신 정적 데이터 스냅샷(public/data/snapshot.json)에서 읽는다.
 * 함수 이름과 반환 모양은 백엔드 API 때와 같아서 호출하는 화면은 바뀌지 않는다.
 */

import { computeStats, findAnimal, queryAnimals, urgentAnimals } from "@/data/animalQueries";
import { loadSnapshot } from "@/data/snapshot";
import { NotFoundError } from "@/lib/apiError";
import { koreanToday } from "@/lib/koreanDate";
import type { AnimalListRequest } from "@/types/dto";

export const animalApi = {
  /** 동물 목록 조회 (필터·검색·정렬·페이지) */
  getAll: async (params?: AnimalListRequest) => queryAnimals(await loadSnapshot(), params ?? {}, koreanToday()),

  /** 동물 상세 조회. 없으면 NotFoundError */
  getById: async (id: number) => {
    const animal = findAnimal(await loadSnapshot(), id, koreanToday());
    if (!animal) throw new NotFoundError("동물을 찾을 수 없습니다.");
    return animal;
  },

  /** 공고 마감이 가까운 동물 (랜딩 페이지용) */
  getUrgentAnimals: async (limit: number = 10) => urgentAnimals(await loadSnapshot(), limit, koreanToday()),

  /** 실시간 현황 (랜딩 페이지용): 공고 중인 동물 수, 일주일 안에 공고가 끝나는 동물 수, 보호소 수 */
  getStats: async () => computeStats(await loadSnapshot(), koreanToday()),
};
