import { describe, expect, it } from "vitest";
import type { Snapshot, SnapshotAnimal, SnapshotShelter } from "@/types/snapshot";
import { findAnimals, recommendAnimals } from "./animalQueries";

const TODAY = "2026-10-30";

const shelter = (id: number, regionSido: string): SnapshotShelter => ({
  id,
  name: `보호소${id}`,
  address: `주소${id}`,
  regionSido,
  regionSigungu: null,
  latitude: null,
  longitude: null,
  phone: null,
});

const animal = (id: number, over: Partial<SnapshotAnimal> = {}): SnapshotAnimal => ({
  id,
  publicApiAnimalId: null,
  shelterId: 1,
  species: "DOG",
  breed: "믹스견",
  color: null,
  name: `이름${id}`,
  age: 2,
  gender: "MALE",
  size: "MEDIUM",
  weight: 10,
  neutered: false,
  status: "PROTECTED",
  noticeStartDate: "2026-10-20",
  noticeEndDate: "2026-11-10",
  imageUrl: "https://img/1.jpg",
  description: null,
  orgName: null,
  chargeName: null,
  chargePhone: null,
  createdAt: "2026-10-01T00:00:00Z",
  ...over,
});

const s: Snapshot = {
  version: 1,
  source: "demo",
  generatedAt: "2026-10-30T00:00:00.000Z",
  today: TODAY,
  shelters: [shelter(1, "서울"), shelter(2, "경기")],
  animals: [
    animal(1, { age: 2, createdAt: "2026-10-01T00:00:00Z" }),
    animal(2, { age: 5, createdAt: "2026-10-03T00:00:00Z", shelterId: 2 }),
    animal(3, { age: 2, imageUrl: null }),
    animal(4, { age: 2, status: "FOSTERING" }),
    animal(5, { age: 2, noticeEndDate: "2026-10-29" }),
    animal(6, { age: null, createdAt: "2026-10-02T00:00:00Z" }),
    animal(7, { age: 1, species: "CAT", size: "SMALL", createdAt: "2026-10-02T00:00:00Z" }),
    animal(8, { age: 2, imageUrl: "" }),
  ],
};

const rec = (pref: Parameters<typeof recommendAnimals>[1]) => recommendAnimals(s, pref, {}, TODAY).content.map((a) => a.id);

describe("선호 조건 기반 추천", () => {
  it("선호 조건이 없으면 빈 목록이다", () => {
    expect(rec(null)).toEqual([]);
    expect(recommendAnimals(s, null, {}, TODAY)).toMatchObject({ totalElements: 0, totalPages: 0 });
  });

  it("사진 없음·임시보호·마감 지난 동물은 빼고 최근 등록순(같으면 id 순)이다", () => {
    expect(rec({ species: "DOG" })).toEqual([2, 6, 1]);
    expect(rec({ species: "CAT", size: "SMALL" })).toEqual([7]);
  });

  it("나이 범위는 양 끝을 포함하고 나이를 모르는 동물은 범위 조건이 있으면 뺀다", () => {
    expect(rec({ species: "DOG", minAge: 2, maxAge: 5 })).toEqual([2, 1]);
    expect(rec({ species: "DOG", minAge: 3 })).toEqual([2]);
    expect(rec({ species: "DOG", maxAge: 2 })).toEqual([1]);
  });

  it("지역은 보호소 시/도가 목록 중 하나여야 하고 공백은 무시한다", () => {
    expect(rec({ species: "DOG", regions: ["경기"] })).toEqual([2]);
    expect(rec({ species: "DOG", regions: [" 서울 ", "부산"] })).toEqual([6, 1]);
    expect(rec({ species: "DOG", regions: ["제주"] })).toEqual([]);
  });

  it("페이지를 나눈다", () => {
    const page = recommendAnimals(s, { species: "DOG" }, { page: 1, size: 2 }, TODAY);
    expect(page.content.map((a) => a.id)).toEqual([1]);
    expect(page).toMatchObject({ totalElements: 3, totalPages: 2 });
  });
});

describe("id 목록으로 동물 찾기 (찜 목록)", () => {
  it("목록 순서를 유지하고 없거나 공고가 끝난 동물은 missing으로 센다", () => {
    const r = findAnimals(s, [7, 5, 99, 1], TODAY);
    expect(r.animals.map((a) => a.id)).toEqual([7, 1]);
    expect(r.missing).toBe(2);
    expect(findAnimals(s, [], TODAY)).toEqual({ animals: [], missing: 0 });
  });
});
