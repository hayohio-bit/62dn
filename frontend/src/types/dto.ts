/**
 * Backend Request/Response DTO 타입
 * 스프링 부트 Controller와 통신할 때 사용
 */

import type {
  Animal,
  Board,
  Comment,
  Preference,
  BoardType,
} from "./entities";

// ========== Common ==========
export interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
  timestamp: string;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface ErrorResponse {
  status: number;
  message: string;
  errors?: Record<string, string[]>;
  timestamp: string;
}

// ========== Auth DTOs ==========
export interface SignupRequest {
  email: string;
  password: string;
  name: string;
  phone: string;
  address?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: UserResponse;
}

export interface UserResponse {
  id: number;
  email: string;
  name: string;
  role: string;
  createdAt?: string;
}

export interface UpdateMeRequest {
  name?: string;
  email?: string;
}

export interface FindEmailRequest {
  name: string;
  phone: string;
}

// ========== Animal DTOs ==========
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
export type AnimalListResponse = PageResponse<Animal>;

// ========== Board DTOs ==========
export interface BoardCreateRequest {
  type: BoardType;
  title: string;
  content: string;
  shelterId?: number;
}

export interface BoardListRequest {
  type?: BoardType;
  page?: number;
  size?: number;
}

export interface CommentCreateRequest {
  content: string;
}

export type BoardResponse = Board;
export type BoardListResponse = PageResponse<Board>;
export type CommentResponse = Comment;

// ========== Preference DTOs ==========
export interface PreferenceRequest {
  species?: "DOG" | "CAT";
  minAge?: number;
  maxAge?: number;
  size?: "SMALL" | "MEDIUM" | "LARGE";
  /** 선호 지역 복수 (시·도 단위, 예: ["서울", "경기"]) */
  regions?: string[];
}

export type PreferenceResponse = Preference;
