import { describe, expect, it } from "vitest";
import {
  CAT_NAMES,
  DOG_NAMES,
  IMAGE_VIEW_BASE,
  buildDescription,
  buildSnapshot,
  extractBreed,
  idFromDesertionNo,
  javaHashCode,
  mapGender,
  mapSpecies,
  mapStatus,
  parseAge,
  parseDate,
  parseRegion,
  parseWeight,
  resolveImageUrl,
  sizeFromWeight,
  temporaryName,
  trimMax,
  usablePhone,
} from "./transform.mjs";

const TODAY = "2026-10-30";
const build = (items, generatedAt = "t") => buildSnapshot({ items, today: TODAY, generatedAt, source: "public-api" });

describe("임시 이름", () => {
  it("이름 후보 개수가 백엔드 TemporaryNames와 같다 (개 104, 고양이 119)", () => {
    expect(DOG_NAMES).toHaveLength(104);
    expect(CAT_NAMES).toHaveLength(119);
    expect(new Set(DOG_NAMES).size).toBe(DOG_NAMES.length);
    expect(new Set(CAT_NAMES).size).toBe(CAT_NAMES.length);
  });

  // 기대값은 Java 21의 String.hashCode()로 계산했다 (2026-10-30, java Hash.java).
  it.each([
    ["448500202600101", -1037811565],
    ["448500202600102", -1037811564],
    ["411300202500001", -2049077487],
    ["a", 97],
    ["", 0],
  ])("Java String.hashCode와 같은 값을 낸다: %s", (s, expected) => {
    expect(javaHashCode(s)).toBe(expected);
  });

  it("같은 유기번호는 백엔드와 같은 이름을 받는다 (floorMod 기준)", () => {
    // -1037811565 floorMod 104 = 67, -1037811564 floorMod 119 = 50
    expect(temporaryName("448500202600101", false)).toBe(DOG_NAMES[67]);
    expect(temporaryName("448500202600102", true)).toBe(CAT_NAMES[50]);
  });

  it("유기번호가 없으면 첫 이름이다", () => {
    expect(temporaryName(null, false)).toBe("보리");
    expect(temporaryName("  ", true)).toBe("라라");
  });
});

describe("체중과 크기", () => {
  it.each([
    ["3.2(Kg)", 3.2],
    ["1~2(Kg)", 1],
    ["12", 12],
    ["(Kg)", null],
    ["", null],
    [null, null],
  ])("체중 %s → %s", (input, expected) => {
    expect(parseWeight(input)).toBe(expected);
  });

  it.each([
    [null, null],
    [0, null],
    [-1, null],
    [4.99, "SMALL"],
    [5, "MEDIUM"],
    [14.99, "MEDIUM"],
    [15, "LARGE"],
  ])("크기 추정 %skg → %s", (kg, expected) => {
    expect(sizeFromWeight(kg)).toBe(expected);
  });
});

describe("나이·성별·상태·종류", () => {
  it.each([
    ["2024(년생)", 2],
    ["2026(60일미만)(년생)", 0],
    ["3", 3],
    ["세 살", null],
    [null, null],
  ])("나이 %s → %s", (input, expected) => {
    expect(parseAge(input, TODAY)).toBe(expected);
  });

  it.each([
    ["M", "MALE"],
    ["f", "FEMALE"],
    ["Q", null],
    [null, null],
  ])("성별 %s → %s", (input, expected) => {
    expect(mapGender(input)).toBe(expected);
  });

  it.each([
    [null, "PROTECTED"],
    ["보호중", "PROTECTED"],
    ["공고중", "PROTECTED"],
    ["임시보호", "FOSTERING"],
    ["종료(입양)", null],
    ["종료(안락사)", null],
    ["", null],
  ])("상태 %s → %s", (input, expected) => {
    expect(mapStatus(input)).toBe(expected);
  });

  it("종류는 축종 코드를 우선하고, 없으면 품종 전체 이름의 '고양이'로 판단한다", () => {
    expect(mapSpecies({ upKindCd: "422400", kindFullNm: "[개] 믹스견" })).toBe("CAT");
    expect(mapSpecies({ upKindCd: "417000", kindFullNm: "[고양이] 코숏" })).toBe("DOG");
    expect(mapSpecies({ kindFullNm: "[고양이] 코리안숏헤어" })).toBe("CAT");
    expect(mapSpecies({})).toBe("DOG");
  });
});

describe("품종", () => {
  it("kindNm이 있으면 그대로 쓴다 (50자 제한)", () => {
    expect(extractBreed({ kindNm: " 믹스견 " })).toBe("믹스견");
    expect(extractBreed({ kindNm: "가".repeat(60) })).toHaveLength(50);
  });

  it("kindNm이 없으면 kindFullNm에서 [축종]을 뗀 값을 쓴다", () => {
    expect(extractBreed({ kindFullNm: "[개] 푸들" })).toBe("푸들");
    expect(extractBreed({ kindFullNm: "[고양이] 코리안 숏헤어" })).toBe("코리안 숏헤어");
  });

  it("값이 없거나 4자리 이상 숫자 코드만 남으면 믹스다", () => {
    expect(extractBreed({})).toBe("믹스");
    expect(extractBreed({ kindFullNm: "[개] " })).toBe("믹스");
    expect(extractBreed({ kindFullNm: "[개] 000114" })).toBe("믹스");
    expect(extractBreed({ kindCd: "999999" })).toBe("믹스");
  });
});

describe("날짜·이미지·설명·연락처", () => {
  it.each([
    ["20261030", "2026-10-30"],
    ["2026103012", "2026-10-30"],
    // Java SMART 해석과 같게 그 달에 없는 일은 마지막 날로 보정하고, 범위 밖 월·일은 null (2026-10-30 Java 21로 확인)
    ["20260230", "2026-02-28"],
    ["20260431", "2026-04-30"],
    ["20261300", null],
    ["20260100", null],
    ["20260132", null],
    ["00000101", null],
    ["2026-10", null],
    [null, null],
  ])("날짜 %s → %s", (input, expected) => {
    expect(parseDate(input)).toBe(expected);
  });

  it("이미지는 popfile1 → popfile2 → popfile → filename 순이고 전체 URL은 그대로 둔다", () => {
    expect(resolveImageUrl({ popfile1: "https://a/1.jpg", popfile2: "https://a/2.jpg" })).toBe("https://a/1.jpg");
    expect(resolveImageUrl({ popfile1: " ", popfile2: "http://a/2.jpg" })).toBe("http://a/2.jpg");
    expect(resolveImageUrl({ filename: "https://a/f.jpg" })).toBe("https://a/f.jpg");
    expect(resolveImageUrl({})).toBeNull();
  });

  it("상대 경로는 animal.go.kr 이미지 뷰어 주소로 만든다", () => {
    const base = IMAGE_VIEW_BASE;
    expect(resolveImageUrl({ popfile: "/files/shelter/2026/10/a.jpg" })).toBe(`${base}/files/shelter/2026/10/a.jpg`);
    expect(resolveImageUrl({ popfile: "/shelter/2026/10/a.jpg" })).toBe(`${base}/files/shelter/2026/10/a.jpg`);
    expect(resolveImageUrl({ popfile: "shelter/2026/10/a.jpg" })).toBe(`${base}/files/shelter/2026/10/a.jpg`);
    expect(resolveImageUrl({ popfile: "a.jpg", happenDt: "20260305" })).toBe(`${base}/files/shelter/2026/03/a.jpg`);
    expect(resolveImageUrl({ popfile: "x/a.jpg" })).toBe(`${base}/files/shelter/a.jpg`);
  });

  it("설명은 발견장소와 특징을 빈 줄로 잇는다", () => {
    expect(buildDescription({ happenPlace: "공원", specialMark: "온순" })).toBe("[발견장소] 공원\n\n[특징] 온순");
    expect(buildDescription({ specialMark: "온순" })).toBe("[특징] 온순");
    expect(buildDescription({})).toBeNull();
    expect(buildDescription({ specialMark: "가".repeat(2500) })).toHaveLength(2000);
  });

  it("연락처는 trim·길이 제한 후 숫자가 전부 0이면 null", () => {
    expect(trimMax("  담당자  ", 50)).toBe("담당자");
    expect(trimMax("", 50)).toBeNull();
    expect(usablePhone("000-0000-0000")).toBeNull();
    expect(usablePhone(" 02-123-4567 ")).toBe("02-123-4567");
    expect(usablePhone("-")).toBeNull();
    expect(usablePhone(null)).toBeNull();
  });
});

describe("주소에서 지역 추출", () => {
  it.each([
    ["경기도 남양주시 경춘로 1037", "경기", "남양주시"],
    ["서울특별시 강동구 성내로 25", "서울", "강동구"],
    ["강원특별자치도 춘천시 중앙로 1", "강원", "춘천시"],
    ["전북특별자치도 전주시 완산구", "전북", "전주시"],
    ["광주광역시 남구 봉선로", "광주", "남구"],
    // 같은 길이의 시/도 패턴은 선언 순서대로 맞추므로 "광주"가 "경기"보다 먼저 걸린다 (백엔드 AddressRegionParser와 같은 동작)
    ["경기 광주시 경안동", "광주", "광주시"],
    ["어딘가 123", null, null],
    ["", null, null],
    [null, null, null],
  ])("%s → %s / %s", (address, sido, sigungu) => {
    expect(parseRegion(address)).toEqual({ sido, sigungu });
  });
});

describe("스냅샷 만들기", () => {
  const base = {
    desertionNo: "448500202600101",
    upKindCd: "417000",
    kindNm: "믹스견",
    processState: "보호중",
    noticeSdt: "20261025",
    noticeEdt: "20261104",
    careNm: "서울 강동 동물보호센터",
    careAddr: "서울특별시 강동구 성내로 25",
    careTel: "02-0000-1001",
    weight: "12.4(Kg)",
    sexCd: "M",
    neuterYn: "N",
    age: "2024(년생)",
    popfile1: "https://a/1.jpg",
    happenPlace: "성내동",
    specialMark: "온순",
    orgNm: "서울특별시 강동구",
    chargeNm: "담당자",
    officetel: "02-1234-5678",
  };

  it("동물과 보호소를 만들고 보호소는 이름으로 합친다", () => {
    const snap = build(
      [base, { ...base, desertionNo: "448500202600102", upKindCd: "422400", careAddr: "다른 주소" }],
      "2026-10-30T00:00:00.000Z",
    );
    expect(snap.version).toBe(1);
    expect(snap.today).toBe(TODAY);
    expect(snap.shelters).toHaveLength(1);
    expect(snap.shelters[0]).toEqual({
      id: 1,
      name: "서울 강동 동물보호센터",
      address: "서울특별시 강동구 성내로 25",
      regionSido: "서울",
      regionSigungu: "강동구",
      phone: "02-0000-1001",
      latitude: null,
      longitude: null,
    });
    expect(snap.animals).toHaveLength(2);
    expect(snap.animals[0]).toEqual({
      id: 448500202600101,
      publicApiAnimalId: "448500202600101",
      shelterId: 1,
      species: "DOG",
      breed: "믹스견",
      color: null,
      name: DOG_NAMES[67],
      age: 2,
      gender: "MALE",
      size: "MEDIUM",
      weight: 12.4,
      neutered: false,
      status: "PROTECTED",
      noticeStartDate: "2026-10-25",
      noticeEndDate: "2026-11-04",
      imageUrl: "https://a/1.jpg",
      description: "[발견장소] 성내동\n\n[특징] 온순",
      orgName: "서울특별시 강동구",
      chargeName: "담당자",
      chargePhone: "02-1234-5678",
      createdAt: "2026-10-30T00:00:00.000Z",
    });
    expect(snap.animals[1].species).toBe("CAT");
    expect(snap.animals[1].name).toBe(CAT_NAMES[50]);
    expect(snap.animals[1].shelterId).toBe(1);
  });

  it("유기번호 없음, 보호 종료, 마감 지난 공고, 중복 유기번호는 제외한다", () => {
    const snap = build([
      { ...base, desertionNo: " " },
      { ...base, processState: "종료(입양)" },
      { ...base, desertionNo: "1", noticeEdt: "20261029" },
      { ...base, desertionNo: "2", noticeEdt: "20261030" },
      { ...base, desertionNo: "3", noticeEdt: null },
      { ...base, desertionNo: "3", kindNm: "두 번째" },
    ]);
    expect(snap.animals.map((a) => a.publicApiAnimalId)).toEqual(["2", "3"]);
    expect(snap.animals[1].breed).toBe("믹스견");
  });

  it("보호소 이름이 없으면 미상이고 좌표는 없다", () => {
    const snap = build([{ ...base, careNm: "", careAddr: null, careTel: null }]);
    expect(snap.shelters[0]).toMatchObject({ name: "미상", address: "", phone: null, regionSido: null });
  });

  it("유기번호가 안전 정수가 아니면 순번 id를 준다", () => {
    expect(idFromDesertionNo("448500202600101")).toBe(448500202600101);
    expect(idFromDesertionNo("99999999999999999")).toBeNull();
    expect(idFromDesertionNo("A1")).toBeNull();
    const snap = build([{ ...base, desertionNo: "1" }, { ...base, desertionNo: "A1" }, { ...base, desertionNo: "B2" }]);
    expect(snap.animals.map((a) => a.id)).toEqual([1, 2, 3]);
  });
});
