/**
 * 정적 사이트가 읽는 데이터 스냅샷(public/data/snapshot.json)의 형식.
 * scripts/build-data/fetch-snapshot.mjs(공공데이터)와 demo-snapshot.mjs(데모)가 만든다.
 * daysUntilExpiry와 통계처럼 "오늘"에 따라 달라지는 값은 넣지 않고 읽는 쪽에서 계산한다.
 */
import type { AnimalStatus, Gender, Size, Species } from "./entities";

export type SnapshotSource = "public-api" | "demo";

export interface SnapshotShelter {
  id: number;
  name: string;
  address: string;
  regionSido: string | null;
  regionSigungu: string | null;
  latitude: number | null;
  longitude: number | null;
  /** 전화 링크로 쓸 수 있는 번호만. 숫자가 모두 0인 번호는 null */
  phone: string | null;
}

export interface SnapshotAnimal {
  /** 공공데이터 동물은 유기번호를 숫자로 쓴다 (공유 링크가 날마다 바뀌지 않도록). 데모는 순번 */
  id: number;
  /** 유기번호. 있으면 화면에 임시 이름·크기 (추정)·중성화 "보호소 확인 필요"로 표시한다 */
  publicApiAnimalId: string | null;
  shelterId: number;
  species: Species;
  breed: string;
  /** 공공데이터의 털색 표기(colorCd 원문, 최대 30자). 없으면 null */
  color: string | null;
  name: string;
  age: number | null;
  gender: Gender | null;
  size: Size | null;
  weight: number | null;
  neutered: boolean;
  status: AnimalStatus;
  /** yyyy-MM-dd */
  noticeStartDate: string | null;
  /** yyyy-MM-dd. 없으면 마감 없음으로 본다 */
  noticeEndDate: string | null;
  imageUrl: string | null;
  description: string | null;
  orgName: string | null;
  chargeName: string | null;
  chargePhone: string | null;
  /** 스냅샷 생성 시각(ISO 8601) */
  createdAt: string;
}

export interface Snapshot {
  version: 1;
  source: SnapshotSource;
  /** 생성 시각(ISO 8601) */
  generatedAt: string;
  /** 생성 기준일 yyyy-MM-dd (Asia/Seoul). 마감 지난 공고는 이 날짜 기준으로 이미 제외되어 있다 */
  today: string;
  animals: SnapshotAnimal[];
  shelters: SnapshotShelter[];
}
