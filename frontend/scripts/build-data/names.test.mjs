import { describe, expect, it } from "vitest";
import {
  AGE_POOLS,
  BREED_POOLS,
  COLOR_POOLS,
  COLOR_WEIGHT,
  SIZE_POOLS,
  ageGroup,
  breedTag,
  colorTag,
  summarizeColors,
  traitCandidates,
} from "./names.mjs";
import { CAT_NAMES, DOG_NAMES, buildSnapshot, temporaryName } from "./transform.mjs";

describe("털색 분류", () => {
  it.each([
    ["흰색", "white"],
    ["백색", "white"],
    ["검정색", "black"],
    ["검정", "black"],
    ["흑색", "black"],
    ["갈색", "brown"],
    ["황색", "yellow"],
    ["노랑", "yellow"],
    ["치즈", "yellow"],
    ["회색", "gray"],
    ["크림색", "cream"],
    ["베이지", "cream"],
    ["삼색", "tricolor"],
    ["고등어", "tabby"],
    ["얼룩", "spotted"],
    ["턱시도", "tuxedo"],
  ])("%s → %s", (input, expected) => {
    expect(colorTag(input, false)).toBe(expected);
  });

  it("두 색이 섞이면 먼저 나온 색을 쓰고, 흰색+검정은 고양이는 턱시도 개는 얼룩이다", () => {
    expect(colorTag("갈색+흰색", false)).toBe("brown");
    expect(colorTag("흰색, 갈색", false)).toBe("white");
    expect(colorTag("흰색+검정", true)).toBe("tuxedo");
    expect(colorTag("흰색+검정", false)).toBe("spotted");
  });

  // 2026-10-31 첫 게시 데이터(2,217마리, 털색 표기 210종)에서 실제로 나온 표기
  it.each([
    ["갈색&흰색", "brown"],
    ["레몬색&흰색", "yellow"],
    ["검정&황갈색", "black"],
    ["갈색&검정&흰색", "tricolor"],
    ["검은색흰색황토색조합", "tricolor"],
    ["평행·전체·부분줄무늬", "tabby"],
    ["흰색/검은색 얼룩무늬", "spotted"],
    ["기타(고등어+흰)", "tabby"],
    ["기타(고등어태비)", "tabby"],
    ["기타(삼색)", "tricolor"],
    ["기타(황갈색)", "brown"],
    ["겨자색", "yellow"],
    ["고동색말단", "brown"],
    ["기타(브린들)", "tabby"],
    ["기타(진호피무늬)", "tabby"],
    ["기타(인절미)", "yellow"],
    ["기타(백)", "white"],
    ["기타()", null],
    ["회백색", "gray"],
    ["연백색", "white"],
    ["백갈색", "white"],
    ["갈백색", "brown"],
  ])("실제 표기 %s → %s", (input, expected) => {
    expect(colorTag(input, false)).toBe(expected);
  });

  it("황갈색·흑갈색 같은 합성 표기는 갈색 한 가지로 본다 (삼색으로 잘못 분류하지 않는다)", () => {
    expect(colorTag("황갈색", false)).toBe("brown");
    expect(colorTag("흑갈색", false)).toBe("brown");
    expect(colorTag("회갈색", true)).toBe("brown");
    expect(colorTag("연갈색", false)).toBe("brown");
    expect(colorTag("황갈색+흰색", false)).toBe("brown");
    expect(colorTag("흑갈색+흰색", true)).toBe("brown");
  });

  it("흑백은 흰색과 검정 두 가지다", () => {
    expect(colorTag("흑백", true)).toBe("tuxedo");
    expect(colorTag("흑백", false)).toBe("spotted");
  });

  it("누렁·백구·쵸코 같은 표기도 알아본다", () => {
    expect(colorTag("누렁이", false)).toBe("yellow");
    expect(colorTag("백구", false)).toBe("white");
    expect(colorTag("쵸코색", false)).toBe("brown");
  });

  it("세 가지 이상 색이 섞이면 삼색이다", () => {
    expect(colorTag("흰색+검정+갈색", true)).toBe("tricolor");
    expect(colorTag("흰, 검, 황", false)).toBe("tricolor");
  });

  it("알 수 없거나 비어 있으면 null이다", () => {
    expect(colorTag("", false)).toBeNull();
    expect(colorTag(null, false)).toBeNull();
    expect(colorTag("기타", false)).toBeNull();
  });
});

describe("나이·품종 분류", () => {
  it("1살 이하는 young, 8살 이상은 senior, 그 사이와 모르면 null", () => {
    expect(ageGroup(0)).toBe("young");
    expect(ageGroup(1)).toBe("young");
    expect(ageGroup(2)).toBeNull();
    expect(ageGroup(7)).toBeNull();
    expect(ageGroup(8)).toBe("senior");
    expect(ageGroup(null)).toBeNull();
  });

  it("품종 이름에 포함된 키워드로 품종 태그를 찾는다", () => {
    expect(breedTag("푸들")).toBe("poodle");
    expect(breedTag("토이 푸들")).toBe("poodle");
    expect(breedTag("말티즈")).toBe("maltese");
    expect(breedTag("진도견")).toBe("jindo");
    expect(breedTag("프렌치 불도그")).toBe("bulldog");
    expect(breedTag("웰시코기 믹스")).toBe("corgi");
    expect(breedTag("믹스견")).toBeNull();
    expect(breedTag("한국 고양이")).toBeNull();
    expect(breedTag(null)).toBeNull();
  });
});

describe("이름 후보", () => {
  it("털색 풀은 가장 눈에 띄는 특징이라 COLOR_WEIGHT번 들어간다", () => {
    expect(COLOR_WEIGHT).toBeGreaterThan(1);
    const c = traitCandidates({ color: "흰색" });
    for (const name of COLOR_POOLS.white) expect(c.filter((n) => n === name)).toHaveLength(COLOR_WEIGHT);
  });

  it("특징에 맞는 풀의 이름만 후보가 된다 (검정 고양이는 흰색 풀 이름을 받지 않는다)", () => {
    const c = traitCandidates({ color: "검정색", isCat: true });
    for (const name of c) expect(COLOR_POOLS.black).toContain(name);
    for (const name of COLOR_POOLS.white) expect(c).not.toContain(name);
  });

  it("털색·크기·나이·품종 풀을 모두 합친다", () => {
    const c = traitCandidates({ color: "갈색", size: "SMALL", age: 1, breed: "푸들", isCat: false });
    for (const pool of [COLOR_POOLS.brown, SIZE_POOLS.SMALL, AGE_POOLS.young, BREED_POOLS.poodle]) {
      for (const name of pool) expect(c).toContain(name);
    }
  });

  it("알 수 있는 특징이 하나도 없으면 빈 후보다", () => {
    expect(traitCandidates({ isCat: false })).toEqual([]);
    expect(traitCandidates({ color: "기타", size: "MEDIUM", age: 4, breed: "믹스견", isCat: true })).toEqual([]);
  });

  it("외모를 놀리거나 부정적으로 읽힐 수 있는 이름, 털색·나이와 모순되는 이름은 어떤 풀에도 없다", () => {
    const forbidden = [
      "검둥이", "깜장이", "먹통", "흑진주", "쥐색이", "짧은다리", "엉덩이", "엉덩이빵", "주름이", "주름", "소시지", "길쭉이",
      "핫도그", "롱이", "순대", "뚱이", "하마", "코끼리", "큰형", "거인", "황소", "기둥이", "덩이", "대왕",
      "아가", "베이비", "꼬물이", "꼬마", "꼬맹이", "백구", "누렁이", "백진", "황진이", "골드", "금이", "황금이", "금빛", "골디",
      "하얀구름", "멸치", "갈치", "꽁치", "삼치",
    ];
    const all = Object.values({ ...COLOR_POOLS, ...SIZE_POOLS, ...AGE_POOLS, ...BREED_POOLS }).flat();
    for (const name of forbidden) expect(all, name).not.toContain(name);
  });

  it("크기 풀은 개에게만 적용하고 고양이는 크기를 이름에 쓰지 않는다", () => {
    expect(traitCandidates({ size: "SMALL", isCat: true })).toEqual([]);
    expect(traitCandidates({ size: "LARGE", isCat: true })).toEqual([]);
    expect(traitCandidates({ size: "SMALL", isCat: false })).toEqual(SIZE_POOLS.SMALL);
  });

  it("줄무늬는 고양이에게는 생선 이름 풀, 개에게는 호랑이 무늬 풀을 쓴다", () => {
    expect(traitCandidates({ color: "고등어", isCat: true })).toContain("고등어");
    const dog = traitCandidates({ color: "고등어", isCat: false });
    expect(dog).toContain("호랑");
    expect(dog).not.toContain("참치");
  });

  it("한 풀 안에 같은 이름이 두 번 들어 있지 않다", () => {
    const all = { ...COLOR_POOLS, ...SIZE_POOLS, ...AGE_POOLS, ...BREED_POOLS };
    for (const [tag, pool] of Object.entries(all)) expect(new Set(pool).size, tag).toBe(pool.length);
  });

  it("풀이 충분히 커서 같은 이름이 한꺼번에 반복되지 않는다 (색 20개, 크기·나이 30개, 품종 6개 이상)", () => {
    for (const [tag, pool] of Object.entries(COLOR_POOLS)) expect(pool.length, tag).toBeGreaterThanOrEqual(20);
    for (const [tag, pool] of Object.entries({ ...SIZE_POOLS, ...AGE_POOLS })) expect(pool.length, tag).toBeGreaterThanOrEqual(30);
    for (const [tag, pool] of Object.entries(BREED_POOLS)) expect(pool.length, tag).toBeGreaterThanOrEqual(6);
  });

  it("후보 이름은 모두 비어 있지 않은 문자열이다", () => {
    for (const pool of [...Object.values(COLOR_POOLS), ...Object.values(SIZE_POOLS), ...Object.values(AGE_POOLS), ...Object.values(BREED_POOLS)]) {
      for (const name of pool) expect(name.trim().length).toBeGreaterThan(0);
    }
  });
});

describe("임시 이름 선택", () => {
  it("특징이 없으면 기존 종류별 후보에서 고른다 (이전 결과와 같다)", () => {
    expect(temporaryName("448500202600101", false)).toBe(DOG_NAMES[67]);
    expect(temporaryName("448500202600102", true)).toBe(CAT_NAMES[50]);
    expect(temporaryName("448500202600101", false, { color: "기타", breed: "믹스견", age: 4, size: "MEDIUM" })).toBe(DOG_NAMES[67]);
  });

  it("같은 유기번호와 같은 특징이면 항상 같은 이름이다", () => {
    const traits = { color: "흰색", size: "SMALL", age: 1, breed: "푸들" };
    const a = temporaryName("411300202500001", false, traits);
    expect(temporaryName("411300202500001", false, traits)).toBe(a);
  });

  it("특징이 있으면 특징 풀의 이름이다 (여러 유기번호로 확인)", () => {
    const allowed = new Set(traitCandidates({ color: "검정색", isCat: true, size: "SMALL" }));
    for (let i = 0; i < 200; i += 1) {
      expect(allowed.has(temporaryName(`44850020260${String(i).padStart(4, "0")}`, true, { color: "검정색", size: "SMALL" }))).toBe(true);
    }
  });

  it("유기번호가 달라도 같은 후보 안에서 여러 이름으로 나뉜다", () => {
    const names = new Set();
    for (let i = 0; i < 200; i += 1) names.add(temporaryName(`44850020260${String(i).padStart(4, "0")}`, true, { color: "흰색" }));
    expect(names.size).toBeGreaterThan(5);
  });
});

describe("스냅샷에 반영", () => {
  const item = {
    desertionNo: "448500202600101",
    upKindCd: "422400",
    kindNm: "한국 고양이",
    colorCd: "검정색",
    weight: "3.2(Kg)",
    age: "2025(년생)",
    processState: "보호중",
    noticeSdt: "20261025",
    noticeEdt: "20261104",
    careNm: "센터",
  };

  it("털색을 스냅샷에 담고 털색·크기·나이에 맞는 이름을 붙인다", () => {
    const snap = buildSnapshot({ items: [item], today: "2026-10-30", generatedAt: "t", source: "public-api" });
    const a = snap.animals[0];
    expect(a.color).toBe("검정색");
    const allowed = traitCandidates({ color: "검정색", size: "SMALL", age: 1, breed: "한국 고양이", isCat: true });
    expect(allowed).toContain(a.name);
  });

  it("털색이 없으면 color는 null이다", () => {
    const snap = buildSnapshot({ items: [{ ...item, colorCd: " " }], today: "2026-10-30", generatedAt: "t", source: "public-api" });
    expect(snap.animals[0].color).toBeNull();
  });
});

describe("털색 분류 현황", () => {
  it("분류한 수·못 한 수·없는 수를 세고 못 한 값을 많이 나온 순으로 돌려준다", () => {
    const animals = [
      { species: "DOG", color: "흰색" },
      { species: "DOG", color: "흰색" },
      { species: "CAT", color: "검정" },
      { species: "CAT", color: "기타색" },
      { species: "CAT", color: "기타색" },
      { species: "DOG", color: "무지개빛" },
      { species: "DOG", color: null },
      { species: "DOG", color: "  " },
    ];
    expect(summarizeColors(animals)).toEqual({
      total: 8,
      missing: 2,
      classified: 3,
      unclassified: 3,
      byTag: { white: 2, black: 1 },
      topUnclassified: [["기타색", 2], ["무지개빛", 1]],
    });
  });
});
