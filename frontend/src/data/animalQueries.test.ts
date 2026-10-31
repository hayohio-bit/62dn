import { describe, expect, it } from "vitest";
import { buildDemoSnapshot } from "../../scripts/build-data/demo-snapshot.mjs";
import type { Snapshot, SnapshotAnimal, SnapshotShelter } from "@/types/snapshot";
import { addDays, addYears, daysBetween, koreanToday } from "@/lib/koreanDate";
import {
  computeStats,
  findAnimal,
  findShelter,
  isOpen,
  queryAnimals,
  queryShelters,
  toAnimal,
  urgentAnimals,
} from "./animalQueries";

const TODAY = "2026-10-30";

const shelter = (id: number, over: Partial<SnapshotShelter> = {}): SnapshotShelter => ({
  id,
  name: `보호소${id}`,
  address: `주소${id}`,
  regionSido: "서울",
  regionSigungu: "강동구",
  latitude: null,
  longitude: null,
  phone: "02-000-0000",
  ...over,
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
  createdAt: "2026-10-30T00:00:00.000Z",
  ...over,
});

const snap = (animals: SnapshotAnimal[], shelters: SnapshotShelter[] = [shelter(1), shelter(2, { regionSido: "경기", regionSigungu: "남양주시" })]): Snapshot => ({
  version: 1,
  source: "demo",
  generatedAt: "2026-10-30T00:00:00.000Z",
  today: TODAY,
  animals,
  shelters,
});

const ids = (page: { content: { id: number }[] }) => page.content.map((a) => a.id);

describe("공고 중 판정과 응답 매핑", () => {
  it("마감일이 없거나 오늘 이후면 공고 중이고, 어제면 아니다", () => {
    expect(isOpen(animal(1, { noticeEndDate: null }), TODAY)).toBe(true);
    expect(isOpen(animal(1, { noticeEndDate: TODAY }), TODAY)).toBe(true);
    expect(isOpen(animal(1, { noticeEndDate: "2026-10-29" }), TODAY)).toBe(false);
  });

  it("보호소 정보를 붙이고 D-day를 오늘 기준으로 계산한다", () => {
    const a = toAnimal(animal(1, { noticeEndDate: "2026-11-01" }), shelter(1, { latitude: 37.5, longitude: 127.1 }), TODAY);
    expect(a).toMatchObject({
      id: 1,
      shelterName: "보호소1",
      shelterAddress: "주소1",
      shelterPhone: "02-000-0000",
      shelterLatitude: 37.5,
      shelterLongitude: 127.1,
      daysUntilExpiry: 2,
      noticeEndDate: "2026-11-01",
    });
    expect(toAnimal(animal(1, { noticeEndDate: null }), undefined, TODAY).daysUntilExpiry).toBeUndefined();
    expect(toAnimal(animal(1), shelter(1, { phone: null }), TODAY).shelterPhone).toBeUndefined();
  });
});

describe("동물 목록 조회", () => {
  const s = snap([
    animal(1, { species: "DOG", size: "SMALL", gender: "MALE", noticeEndDate: "2026-11-05", noticeStartDate: "2026-10-28" }),
    animal(2, { species: "CAT", size: "MEDIUM", gender: "FEMALE", shelterId: 2, noticeEndDate: "2026-11-01", noticeStartDate: "2026-10-20" }),
    animal(3, { species: "DOG", status: "FOSTERING", noticeEndDate: null, noticeStartDate: null }),
    animal(4, { species: "DOG", noticeEndDate: "2026-10-29" }),
    animal(5, { species: "DOG", publicApiAnimalId: "1", name: "콩이", breed: "푸들", noticeEndDate: "2026-11-05", noticeStartDate: "2026-10-28" }),
  ]);

  it("마감 지난 동물은 빼고 기본 정렬은 마감 임박순, 마감 없는 동물은 뒤로, 같은 값은 id 순이다", () => {
    expect(ids(queryAnimals(s, {}, TODAY))).toEqual([2, 1, 5, 3]);
  });

  it("종류·크기·성별·상태·보호소 필터가 정확히 일치해야 한다", () => {
    expect(ids(queryAnimals(s, { species: "CAT" }, TODAY))).toEqual([2]);
    expect(ids(queryAnimals(s, { animalSize: "SMALL" }, TODAY))).toEqual([1]);
    expect(ids(queryAnimals(s, { gender: "FEMALE" }, TODAY))).toEqual([2]);
    expect(ids(queryAnimals(s, { status: "FOSTERING" }, TODAY))).toEqual([3]);
    expect(ids(queryAnimals(s, { shelterId: 2 }, TODAY))).toEqual([2]);
  });

  it("지역 필터는 보호소의 시/도·시군구와 정확히 일치해야 한다", () => {
    expect(ids(queryAnimals(s, { region: "경기" }, TODAY))).toEqual([2]);
    expect(ids(queryAnimals(s, { region: "서울", sigungu: "강동구" }, TODAY))).toEqual([1, 5, 3]);
    expect(ids(queryAnimals(s, { region: "서울", sigungu: "남양주시" }, TODAY))).toEqual([]);
  });

  it("검색은 품종·보호소명에 부분 일치하고, 이름은 임시 이름이 아닐 때만 맞춘다", () => {
    expect(ids(queryAnimals(s, { search: "푸들" }, TODAY))).toEqual([5]);
    expect(ids(queryAnimals(s, { search: "보호소2" }, TODAY))).toEqual([2]);
    expect(ids(queryAnimals(s, { search: "이름1" }, TODAY))).toEqual([1]);
    expect(ids(queryAnimals(s, { search: "콩이" }, TODAY))).toEqual([]);
    expect(ids(queryAnimals(snap([animal(9, { breed: "Poodle" })]), { search: "poodle" }, TODAY))).toEqual([9]);
  });

  it("정렬은 noticeStartDate desc를 지원하고 허용되지 않은 값은 기본 정렬로 처리한다", () => {
    expect(ids(queryAnimals(s, { sort: "noticeStartDate,desc" }, TODAY))).toEqual([1, 5, 2, 3]);
    expect(ids(queryAnimals(s, { sort: "name,asc" }, TODAY))).toEqual([2, 1, 5, 3]);
    expect(ids(queryAnimals(s, { sort: "noticeEndDate,desc" }, TODAY))).toEqual([1, 5, 2, 3]);
  });

  it("방향을 적지 않으면 백엔드 계약대로 내림차순이고, 토큰의 공백은 무시한다", () => {
    expect(ids(queryAnimals(s, { sort: "noticeStartDate" }, TODAY))).toEqual([1, 5, 2, 3]);
    expect(ids(queryAnimals(s, { sort: " noticeEndDate , ASC " }, TODAY))).toEqual([2, 1, 5, 3]);
    expect(ids(queryAnimals(s, { sort: "noticeEndDate,dsc" }, TODAY))).toEqual([1, 5, 2, 3]);
  });

  it("URL에서 온 잘못된 페이지 값과 공백 섞인 지역 값은 기본값으로 처리한다", () => {
    expect(queryAnimals(s, { page: -2, sizeParam: 0 }, TODAY)).toMatchObject({ page: 0, size: 10, totalPages: 1 });
    expect(queryAnimals(s, { page: Number.NaN, sizeParam: Number.NaN }, TODAY)).toMatchObject({ page: 0, size: 10 });
    expect(ids(queryAnimals(s, { region: " 경기 ", sigungu: "  " }, TODAY))).toEqual([2]);
    expect(queryShelters(snap([]), { page: -1, size: 0 })).toMatchObject({ page: 0, size: 10 });
  });

  it("페이지는 sizeParam 단위로 자르고 기본 크기는 10이다", () => {
    const first = queryAnimals(s, { page: 0, sizeParam: 3 }, TODAY);
    expect(first).toMatchObject({ page: 0, size: 3, totalElements: 4, totalPages: 2 });
    expect(ids(first)).toEqual([2, 1, 5]);
    expect(ids(queryAnimals(s, { page: 1, sizeParam: 3 }, TODAY))).toEqual([3]);
    expect(queryAnimals(s, { page: 5, sizeParam: 3 }, TODAY).content).toEqual([]);
    expect(queryAnimals(s, {}, TODAY).size).toBe(10);
    expect(queryAnimals(s, { species: "CAT", gender: "MALE" }, TODAY)).toMatchObject({ totalElements: 0, totalPages: 0 });
  });

  it("id로 찾고 없으면 null이다", () => {
    expect(findAnimal(s, 2, TODAY)?.shelterName).toBe("보호소2");
    expect(findAnimal(s, 999, TODAY)).toBeNull();
  });
});

describe("마감 임박과 실시간 현황", () => {
  const s = snap([
    animal(1, { noticeEndDate: "2026-11-02" }),
    animal(2, { noticeEndDate: "2026-10-30" }),
    animal(3, { noticeEndDate: "2026-11-01", imageUrl: "" }),
    animal(4, { noticeEndDate: "2026-11-06", status: "FOSTERING" }),
    animal(5, { noticeEndDate: null }),
    animal(6, { noticeEndDate: "2027-10-30", shelterId: 2 }),
    animal(7, { noticeEndDate: "2027-10-31" }),
    animal(8, { noticeEndDate: "2026-10-29" }),
    animal(9, { noticeEndDate: "2026-11-06" }),
  ]);

  it("마감 임박은 사진 있는 보호 중 동물 중 1년 안에 마감되는 순서로 limit만큼이다", () => {
    expect(urgentAnimals(s, 10, TODAY).map((a) => a.id)).toEqual([2, 1, 9, 6]);
    expect(urgentAnimals(s, 2, TODAY).map((a) => a.id)).toEqual([2, 1]);
  });

  it("현황은 보호 중·공고 중 동물 수, 일주일 안 마감 수(양 끝 포함), 보호소 수다", () => {
    expect(computeStats(s, TODAY)).toEqual({ protectedCount: 7, endingWithinWeekCount: 4, shelterCount: 2 });
  });
});

describe("보호소 조회", () => {
  const s = snap(
    [],
    [
      shelter(1, { name: "서울 강동 센터", address: "서울특별시 강동구" }),
      shelter(2, { name: "남양주 센터", address: "경기도 남양주시", regionSido: "경기", regionSigungu: "남양주시" }),
      shelter(3, { name: "강동 제2센터", address: "서울특별시 강동구 2", phone: null, latitude: null }),
    ],
  );

  it("시/도 정확 일치와 이름·주소 키워드로 거르고 id 내림차순이다", () => {
    expect(queryShelters(s, {}).content.map((x) => x.id)).toEqual([3, 2, 1]);
    expect(queryShelters(s, { regionSido: "경기" }).content.map((x) => x.id)).toEqual([2]);
    expect(queryShelters(s, { keyword: "강동" }).content.map((x) => x.id)).toEqual([3, 1]);
    expect(queryShelters(s, { keyword: "남양주시" }).content.map((x) => x.id)).toEqual([2]);
    expect(queryShelters(s, { page: 1, size: 2 })).toMatchObject({ totalElements: 3, totalPages: 2 });
    expect(queryShelters(s, { page: 1, size: 2 }).content.map((x) => x.id)).toEqual([1]);
  });

  it("응답에서 null은 빠지고(undefined) 없는 id는 null이다", () => {
    expect(findShelter(s, 3)).toEqual({ id: 3, name: "강동 제2센터", address: "서울특별시 강동구 2", regionSido: "서울", regionSigungu: "강동구" });
    expect(findShelter(s, 99)).toBeNull();
  });
});

describe("데모 스냅샷으로 전체 흐름", () => {
  const s = buildDemoSnapshot(TODAY, "2026-10-30T00:00:00.000Z");

  it("목록·마감 임박·현황·보호소 검색이 데모 데이터와 맞는다", () => {
    const list = queryAnimals(s, { sizeParam: 12 }, TODAY);
    expect(list.totalElements).toBe(20);
    expect(list.content[0]).toMatchObject({ name: "호두", daysUntilExpiry: 1, shelterName: "인천 연수 동물보호센터" });
    expect(queryAnimals(s, { species: "CAT", status: "PROTECTED" }, TODAY).totalElements).toBe(7);
    expect(queryAnimals(s, { region: "제주" }, TODAY).totalElements).toBe(3);
    expect(urgentAnimals(s, 12, TODAY)).toHaveLength(12);
    expect(computeStats(s, TODAY)).toEqual({ protectedCount: 19, endingWithinWeekCount: 8, shelterCount: 6 });
    expect(queryShelters(s, { keyword: "제주" }).content[0]).toMatchObject({ name: "제주 동물보호센터", latitude: 33.4996 });
  });
});

describe("한국 날짜 계산", () => {
  it("UTC 15시부터는 한국에서 다음 날이다", () => {
    expect(koreanToday(new Date("2026-10-30T15:00:00Z"))).toBe("2026-10-31");
    expect(koreanToday(new Date("2026-10-30T14:59:59Z"))).toBe("2026-10-30");
  });

  it("일·연 더하기와 일수 차이", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addYears("2028-02-29", 1)).toBe("2029-02-28");
    expect(addYears("2026-10-30", 1)).toBe("2027-10-30");
    expect(daysBetween("2026-10-30", "2026-11-01")).toBe(2);
    expect(daysBetween("2026-10-30", "2026-10-29")).toBe(-1);
  });
});
