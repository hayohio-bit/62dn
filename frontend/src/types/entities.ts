/**
 * Backend Entity 타입 정의
 * 스프링 부트 JPA Entity와 일치
 */

export type Role = "USER" | "SUPER_ADMIN";

export interface User {
  id: number;
  email: string;
  name: string;
  phone: string;
  role: Role;
  address?: string;
  createdAt: string;
}

export interface Preference {
  id: number;
  userId: number;
  species?: Species;
  minAge?: number;
  maxAge?: number;
  size?: Size;
  /** 선호 지역 복수 (시·도 단위) */
  regions?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export type Species = "DOG" | "CAT";
export type Gender = "MALE" | "FEMALE";
export type Size = "SMALL" | "MEDIUM" | "LARGE";
export type AnimalStatus = "PROTECTED" | "FOSTERING";

export interface Animal {
  id: number;
  /** 공공 API 유기번호 (보호소 전화 문의 시 식별용) */
  publicApiAnimalId?: string | null;
  /** 관할기관 (공공 API orgNm) */
  orgName?: string | null;
  /** 담당자 (공공 API chargeNm) */
  chargeName?: string | null;
  /** 담당자 연락처 (공공 API officetel) */
  chargePhone?: string | null;
  shelterId: number;
  shelterName?: string;
  /** 보호소 주소 (상세페이지·지도 표시용) */
  shelterAddress?: string;
  /** 보호소 전화번호 */
  shelterPhone?: string;
  /** 보호소 위도 (지도 마커용) */
  shelterLatitude?: number;
  /** 보호소 경도 */
  shelterLongitude?: number;
  species: Species;
  breed: string;
  name: string;
  age: number;
  gender: Gender;
  size: Size;
  neutered: boolean;
  status: AnimalStatus;
  noticeStartDate?: string;
  noticeEndDate?: string;
  daysUntilExpiry?: number;
  imageUrl?: string;
  description?: string;
  createdAt: string;
}

export type BoardType = "NOTICE" | "FAQ" | "FREE";

export interface Board {
  id: number;
  userId: number;
  userName?: string;
  shelterId?: number;
  type: BoardType;
  title: string;
  content: string;
  views: number;
  isPinned: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface Comment {
  id: number;
  boardId: number;
  userId: number;
  userName?: string;
  content: string;
  createdAt: string;
}

export interface PublicShelterResponse {
  id: number;
  name: string;
  address: string;
  regionSido?: string;
  regionSigungu?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
}
