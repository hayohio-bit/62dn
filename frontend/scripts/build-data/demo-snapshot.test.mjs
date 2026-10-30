import { describe, expect, it } from "vitest";
import { buildDemoSnapshot } from "./demo-snapshot.mjs";
import { CAT_NAMES, DOG_NAMES } from "./transform.mjs";
import { addDays, assertNotEmpty, koreanToday } from "./snapshot-file.mjs";

const TODAY = "2026-10-30";

describe("데모 스냅샷", () => {
  const snap = buildDemoSnapshot(TODAY, "2026-10-30T00:00:00.000Z");

  it("보호소 6곳, 동물 20마리(개 12, 고양이 8)를 만든다", () => {
    expect(snap.source).toBe("demo");
    expect(snap.today).toBe(TODAY);
    expect(snap.shelters).toHaveLength(6);
    expect(snap.animals).toHaveLength(20);
    expect(snap.animals.filter((a) => a.species === "DOG")).toHaveLength(12);
    expect(snap.animals.filter((a) => a.species === "CAT")).toHaveLength(8);
    expect(snap.animals.filter((a) => a.status === "FOSTERING").map((a) => a.name)).toEqual(["귤이"]);
  });

  it("모든 동물이 실제 보호소를 가리키고 id는 겹치지 않는다", () => {
    const shelterIds = new Set(snap.shelters.map((s) => s.id));
    expect(snap.animals.every((a) => shelterIds.has(a.shelterId))).toBe(true);
    expect(new Set(snap.animals.map((a) => a.id)).size).toBe(20);
  });

  it("공고일은 오늘 기준 상대값이라 마감이 지난 동물이 없다", () => {
    expect(snap.animals.every((a) => a.noticeEndDate >= TODAY)).toBe(true);
    expect(snap.animals.every((a) => a.noticeStartDate <= TODAY)).toBe(true);
    const boriDog = snap.animals[0];
    expect(boriDog.noticeEndDate).toBe("2026-11-01");
    expect(boriDog.noticeStartDate).toBe("2026-10-28");
  });

  it("공공데이터로 들어온 것처럼 표시한 두 마리는 임시 이름·중성화 모름·체중 기반 크기다", () => {
    const [dog, cat] = [snap.animals[9], snap.animals[17]];
    expect(dog).toMatchObject({ publicApiAnimalId: "448500202600101", name: DOG_NAMES[67], neutered: false, weight: 11.4, size: "MEDIUM" });
    expect(cat).toMatchObject({ publicApiAnimalId: "448500202600102", name: CAT_NAMES[50], neutered: false, weight: null, size: null });
    expect(snap.animals.filter((a) => a.publicApiAnimalId)).toHaveLength(2);
  });

  it("스냅샷 타입의 필드를 모두 채운다", () => {
    const animalKeys = [
      "id", "publicApiAnimalId", "shelterId", "species", "breed", "name", "age", "gender", "size", "weight", "neutered",
      "status", "noticeStartDate", "noticeEndDate", "imageUrl", "description", "orgName", "chargeName", "chargePhone", "createdAt",
    ].sort();
    const shelterKeys = ["id", "name", "address", "regionSido", "regionSigungu", "latitude", "longitude", "phone"].sort();
    for (const a of snap.animals) expect(Object.keys(a).sort()).toEqual(animalKeys);
    for (const s of snap.shelters) expect(Object.keys(s).sort()).toEqual(shelterKeys);
  });
});

describe("날짜 계산", () => {
  it("한국 날짜를 yyyy-MM-dd로 돌려준다 (UTC 자정 직전은 한국에서 다음 날)", () => {
    expect(koreanToday(new Date("2026-10-30T15:30:00Z"))).toBe("2026-10-31");
    expect(koreanToday(new Date("2026-10-30T14:30:00Z"))).toBe("2026-10-30");
  });

  it("일수를 더하고 뺄 때 달과 해를 넘긴다", () => {
    expect(addDays("2026-10-30", 2)).toBe("2026-11-01");
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
    expect(addDays("2026-10-30", 0)).toBe("2026-10-30");
  });
});

describe("빈 스냅샷 보호", () => {
  it("동물이 한 마리도 없으면 저장하지 않고 실패한다", () => {
    expect(() => assertNotEmpty({ animals: [], shelters: [] })).toThrow("한 마리도 받지 못했습니다");
    expect(() => assertNotEmpty(buildDemoSnapshot(TODAY, "t"))).not.toThrow();
  });
});
