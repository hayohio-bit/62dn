/**
 * 화면과 조회 함수(data/animalQueries.ts)가 주고받는 요청·응답 타입
 */

import type { Animal } from "./entities";

// ========== Common ==========
export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

// ========== Animal DTOs ==========
/** 랜딩 실시간 현황 */
export interface AnimalStatsResponse {
  /** 지금 보호 중(공고 중)인 동물 수 */
  protectedCount: number;
  /** 오늘(D-Day)부터 D-7 사이에 공고가 끝나는 동물 수 */
  endingWithinWeekCount: number;
  /** 보호 중인 동물이 있는 보호소 수 */
  shelterCount: number;
}

export interface AnimalListRequest {
  species?: "DOG" | "CAT";
  /** 동물 크기 필터 (API param: animalSize, size와 충돌 방지) */
  animalSize?: "SMALL" | "MEDIUM" | "LARGE";
  gender?: "MALE" | "FEMALE";
  /** 특정 보호소의 동물만 조회 (보호소 페이지, 같은 보호소의 다른 아이들) */
  shelterId?: number;
  status?: "PROTECTED" | "FOSTERING";
  /** 보호소 주소 기준 지역 필터 (시·도 키워드, 예: 서울, 경기) */
  region?: string;
  /** 시·군·구 키워드 (시/도 선택 시 세부 조회, 예: 강남구, 수원시) */
  sigungu?: string;
  /** 이름·품종·보호소명 검색 (서버 검색) */
  search?: string;
  /** 정렬: "필드,방향" 형식. 서버는 noticeEndDate·noticeStartDate·createdAt만 허용 (기본값 noticeEndDate,asc) */
  sort?: string;
  page?: number;
  /** 백엔드 동물 목록 API 페이지 크기 파라미터명 */
  sizeParam?: number;
}

export type AnimalResponse = Animal;

// ========== Preference DTOs ==========
export interface PreferenceRequest {
  species?: "DOG" | "CAT";
  minAge?: number;
  maxAge?: number;
  size?: "SMALL" | "MEDIUM" | "LARGE";
  /** 선호 지역 복수 (시·도 단위, 예: ["서울", "경기"]) */
  regions?: string[];
}
