/**
 * 보호소 API 모듈. 백엔드 대신 정적 데이터 스냅샷에서 읽는다 (봉사·기부 페이지의 보호소 검색, 보호소 페이지).
 */
import { findShelter, queryShelters } from "@/data/animalQueries";
import { loadSnapshot } from "@/data/snapshot";
import { NotFoundError } from "@/lib/apiError";

export const shelterApi = {
  getPublicShelters: async (regionSido?: string, keyword?: string, page = 0, size = 10) =>
    queryShelters(await loadSnapshot(), { regionSido, keyword, page, size }),

  /** 보호소 상세 (보호소 페이지용). 없으면 NotFoundError */
  getPublicShelter: async (id: number) => {
    const shelter = findShelter(await loadSnapshot(), id);
    if (!shelter) throw new NotFoundError("보호소를 찾을 수 없습니다.");
    return shelter;
  },
};
