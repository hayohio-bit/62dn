/**
 * 최근 본 동물 기록 (브라우저 localStorage)
 * 로그인하지 않아도 앞서 본 동물을 다시 찾을 수 있도록 상세 화면을 열 때마다 기록한다.
 * 목록에 표시할 최소 정보만 저장하고, 공고 마감일이 지난 동물은 읽을 때 뺀다.
 */
import type { Animal } from "@/types/entities";

const STORAGE_KEY = "dn:recent-animals";
const MAX_ITEMS = 10;

export type RecentAnimal = Pick<Animal, "id" | "name" | "imageUrl" | "species" | "breed" | "noticeEndDate">;

/** "2026-09-30" 형식의 날짜까지 남은 일수. 오늘이면 0, 지났으면 음수 */
export function daysUntil(isoDate: string, today = new Date()): number {
  const [y, m, d] = isoDate.split("-").map(Number);
  const end = Date.UTC(y, m - 1, d);
  const start = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((end - start) / 86_400_000);
}

function read(): RecentAnimal[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as RecentAnimal[]).filter((a) => typeof a?.id === "number") : [];
  } catch {
    // 저장소를 쓸 수 없는 환경(사생활 보호 모드 등)이거나 값이 손상됐으면 기록 없음으로 본다
    return [];
  }
}

function write(items: RecentAnimal[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // 저장 공간이 없거나 저장소를 쓸 수 없으면 기록하지 않는다
  }
}

/** 공고 마감일이 지나지 않은 최근 본 동물 (최근 순) */
export function getRecentAnimals(): RecentAnimal[] {
  return read().filter((a) => !a.noticeEndDate || daysUntil(a.noticeEndDate) >= 0);
}

/** 본 동물을 목록 맨 앞에 기록한다. 이미 있으면 앞으로 옮긴다 */
export function recordRecentAnimal(animal: Animal) {
  const item: RecentAnimal = {
    id: animal.id,
    name: animal.name,
    imageUrl: animal.imageUrl,
    species: animal.species,
    breed: animal.breed,
    noticeEndDate: animal.noticeEndDate,
  };
  write([item, ...read().filter((a) => a.id !== animal.id)].slice(0, MAX_ITEMS));
}

export function clearRecentAnimals() {
  write([]);
}
