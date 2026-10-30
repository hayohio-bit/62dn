/**
 * 스냅샷에서 동물·보호소를 조회하는 순수 함수. 백엔드가 하던 필터·정렬·검색·페이지·통계 규칙을 그대로 옮겼다.
 * - 공고 중 판정: 마감일이 없거나 오늘(Asia/Seoul) 이후 (AnimalRepository.findWithFilters, 통계 쿼리 공통)
 * - 검색: 품종·보호소명 부분 일치, 이름은 임시 이름(유기번호 있음)이 아닐 때만. 대소문자 무시
 * - 정렬: noticeEndDate·noticeStartDate·createdAt만 허용, 그 외는 noticeEndDate asc. 값 없는 동물은 뒤로, 같은 값은 id 오름차순
 */
import type { AnimalListRequest, AnimalStatsResponse, PageResponse } from "@/types/dto";
import type { Animal, PublicShelterResponse } from "@/types/entities";
import type { Snapshot, SnapshotAnimal, SnapshotShelter } from "@/types/snapshot";
import { isTemporaryName } from "@/constants/animalLabels";
import { addDays, addYears, daysBetween } from "@/lib/koreanDate";

const SORT_FIELDS = ["noticeEndDate", "noticeStartDate", "createdAt"] as const;
type SortField = (typeof SORT_FIELDS)[number];
const DEFAULT_SORT: [SortField, "asc" | "desc"] = ["noticeEndDate", "asc"];
/** 백엔드 AnimalController의 size 기본값 */
const DEFAULT_PAGE_SIZE = 10;

export function isOpen(animal: SnapshotAnimal, today: string): boolean {
  return animal.noticeEndDate == null || animal.noticeEndDate >= today;
}

function shelterMap(snapshot: Snapshot): Map<number, SnapshotShelter> {
  return new Map(snapshot.shelters.map((s) => [s.id, s]));
}

/** 백엔드 AnimalMapper.toResponse와 같은 응답 모양. daysUntilExpiry는 읽는 시점의 오늘로 계산한다 */
export function toAnimal(animal: SnapshotAnimal, shelter: SnapshotShelter | undefined, today: string): Animal {
  return {
    id: animal.id,
    publicApiAnimalId: animal.publicApiAnimalId,
    orgName: animal.orgName,
    chargeName: animal.chargeName,
    chargePhone: animal.chargePhone,
    shelterId: animal.shelterId,
    shelterName: shelter?.name,
    shelterAddress: shelter?.address,
    shelterPhone: shelter?.phone ?? undefined,
    shelterLatitude: shelter?.latitude ?? undefined,
    shelterLongitude: shelter?.longitude ?? undefined,
    species: animal.species,
    breed: animal.breed,
    name: animal.name,
    age: animal.age,
    gender: animal.gender,
    size: animal.size,
    weight: animal.weight,
    neutered: animal.neutered,
    status: animal.status,
    noticeStartDate: animal.noticeStartDate ?? undefined,
    noticeEndDate: animal.noticeEndDate ?? undefined,
    daysUntilExpiry: animal.noticeEndDate ? daysBetween(today, animal.noticeEndDate) : undefined,
    imageUrl: animal.imageUrl ?? undefined,
    description: animal.description ?? undefined,
    createdAt: animal.createdAt,
  };
}

function parseSort(sort: string | undefined): [SortField, "asc" | "desc"] {
  if (!sort) return DEFAULT_SORT;
  const [field, dir] = sort.split(",");
  if (!(SORT_FIELDS as readonly string[]).includes(field)) return DEFAULT_SORT;
  return [field as SortField, dir?.toLowerCase() === "desc" ? "desc" : "asc"];
}

/** 값이 없는 동물은 방향과 상관없이 뒤로(NULLS LAST), 같은 값은 id 오름차순 */
function compareBy(field: SortField, dir: "asc" | "desc") {
  const sign = dir === "asc" ? 1 : -1;
  return (a: SnapshotAnimal, b: SnapshotAnimal) => {
    const av = a[field];
    const bv = b[field];
    if (av === bv) return a.id - b.id;
    if (av == null) return 1;
    if (bv == null) return -1;
    return (av < bv ? -1 : 1) * sign;
  };
}

/** 마감일이 from~to 사이(양 끝 포함)인지 */
function endsBetween(animal: SnapshotAnimal, from: string, to: string): boolean {
  return animal.noticeEndDate != null && animal.noticeEndDate >= from && animal.noticeEndDate <= to;
}

function paginate<T>(items: T[], page: number, size: number): PageResponse<T> {
  const start = page * size;
  return {
    content: items.slice(start, start + size),
    page,
    size,
    totalElements: items.length,
    totalPages: Math.ceil(items.length / size),
  };
}

function includesIgnoreCase(haystack: string | null | undefined, needle: string): boolean {
  return haystack != null && haystack.toLowerCase().includes(needle);
}

export function queryAnimals(snapshot: Snapshot, request: AnimalListRequest, today: string): PageResponse<Animal> {
  const shelters = shelterMap(snapshot);
  const search = request.search?.trim().toLowerCase();

  const matched = snapshot.animals.filter((a) => {
    if (!isOpen(a, today)) return false;
    if (request.species && a.species !== request.species) return false;
    if (request.animalSize && a.size !== request.animalSize) return false;
    if (request.gender && a.gender !== request.gender) return false;
    if (request.status && a.status !== request.status) return false;
    if (request.shelterId != null && a.shelterId !== request.shelterId) return false;
    const shelter = shelters.get(a.shelterId);
    if (request.region && shelter?.regionSido !== request.region) return false;
    if (request.sigungu && shelter?.regionSigungu !== request.sigungu) return false;
    if (search) {
      const nameMatches = !isTemporaryName(a) && includesIgnoreCase(a.name, search);
      if (!includesIgnoreCase(a.breed, search) && !includesIgnoreCase(shelter?.name, search) && !nameMatches) return false;
    }
    return true;
  });

  const [field, dir] = parseSort(request.sort);
  matched.sort(compareBy(field, dir));

  const page = paginate(matched, request.page ?? 0, request.sizeParam ?? DEFAULT_PAGE_SIZE);
  return { ...page, content: page.content.map((a) => toAnimal(a, shelters.get(a.shelterId), today)) };
}

export function findAnimal(snapshot: Snapshot, id: number, today: string): Animal | null {
  const animal = snapshot.animals.find((a) => a.id === id);
  if (!animal) return null;
  return toAnimal(animal, snapshot.shelters.find((s) => s.id === animal.shelterId), today);
}

/** 마감 임박: 사진이 있고 보호 중이며 마감일이 오늘부터 1년 안인 동물을 마감 가까운 순으로 (AnimalRepository.findUrgent) */
export function urgentAnimals(snapshot: Snapshot, limit: number, today: string): Animal[] {
  const shelters = shelterMap(snapshot);
  const until = addYears(today, 1);
  return snapshot.animals
    .filter((a) => a.imageUrl != null && a.status === "PROTECTED" && endsBetween(a, today, until))
    .sort(compareBy("noticeEndDate", "asc"))
    .slice(0, limit)
    .map((a) => toAnimal(a, shelters.get(a.shelterId), today));
}

/** 랜딩 실시간 현황 (AnimalService.getStats) */
export function computeStats(snapshot: Snapshot, today: string): AnimalStatsResponse {
  const weekEnd = addDays(today, 7);
  const protectedOpen = snapshot.animals.filter((a) => a.status === "PROTECTED" && isOpen(a, today));
  return {
    protectedCount: protectedOpen.length,
    endingWithinWeekCount: protectedOpen.filter((a) => endsBetween(a, today, weekEnd)).length,
    shelterCount: new Set(protectedOpen.map((a) => a.shelterId)).size,
  };
}

export function toShelter(shelter: SnapshotShelter): PublicShelterResponse {
  return {
    id: shelter.id,
    name: shelter.name,
    address: shelter.address,
    regionSido: shelter.regionSido ?? undefined,
    regionSigungu: shelter.regionSigungu ?? undefined,
    latitude: shelter.latitude ?? undefined,
    longitude: shelter.longitude ?? undefined,
    phone: shelter.phone ?? undefined,
  };
}

export interface ShelterQuery {
  regionSido?: string;
  keyword?: string;
  page?: number;
  size?: number;
}

/** 보호소 검색: 시/도 정확 일치, 키워드는 이름·주소 부분 일치, id 내림차순 (ShelterRepository.search) */
export function queryShelters(snapshot: Snapshot, query: ShelterQuery): PageResponse<PublicShelterResponse> {
  const keyword = query.keyword?.trim().toLowerCase();
  const matched = snapshot.shelters
    .filter((s) => !query.regionSido || s.regionSido === query.regionSido)
    .filter((s) => !keyword || includesIgnoreCase(s.name, keyword) || includesIgnoreCase(s.address, keyword))
    .sort((a, b) => b.id - a.id);
  const page = paginate(matched, query.page ?? 0, query.size ?? DEFAULT_PAGE_SIZE);
  return { ...page, content: page.content.map(toShelter) };
}

export function findShelter(snapshot: Snapshot, id: number): PublicShelterResponse | null {
  const shelter = snapshot.shelters.find((s) => s.id === id);
  return shelter ? toShelter(shelter) : null;
}
