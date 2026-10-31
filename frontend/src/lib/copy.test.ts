import { describe, expect, it } from "vitest";

/** 사이트에 보이는 문구에서 쓰지 않기로 한 표현을 막는 점검. 주석은 제외하고 문자열·JSX 문구만 본다 */
const FORBIDDEN: { pattern: RegExp; why: string }[] = [
  { pattern: /안락사/, why: "공식 용어는 '인도적 처리'다 (실태조사 원문, 동물보호법 제46조)" },
  { pattern: /D-Day|D-\d|D-\$\{|마감까지|마감 임박/, why: "카운트다운 표현 대신 숫자 없는 공고 기간 막대를 쓴다" },
  { pattern: /62댕냥이 붙인|62댕냥 사이트 보고|62댕냥이나/, why: "안내 문구에 서비스 이름을 출처처럼 쓰지 않는다" },
  { pattern: /찜한|찜하기|찜 해제|찜 목록/, why: "유기동물에는 '관심 동물'을 쓴다" },
  { pattern: /생을 마감|살처분|무지개다리|10마리 중 4마리/, why: "순한 표현과 원문 용어를 쓰고, 바뀐 통계 문구(10마리 중 4마리)를 되살리지 않는다" },
];

/** src 아래 소스 파일의 원문 (테스트 파일 제외). Vite가 빌드 때 문자열로 담아 주므로 Node 타입이 필요 없다 */
const sources = import.meta.glob(["../**/*.ts", "../**/*.tsx", "!../**/*.test.ts", "!../**/*.test.tsx", "!../**/*.d.ts"], {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

/** 블록 주석과 줄 주석을 지운다. URL의 // 는 앞에 공백이 없어서 남는다 */
function stripComments(code: string): string {
  return code.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|\s)\/\/.*$/gm, "$1");
}

describe("사이트 문구 점검", () => {
  it("점검 대상 파일이 있다", () => {
    expect(Object.keys(sources).length).toBeGreaterThan(20);
  });

  it.each(FORBIDDEN)("$pattern 표현이 화면 문구에 없다 ($why)", ({ pattern }) => {
    const hits = Object.entries(sources)
      .filter(([, code]) => pattern.test(stripComments(code)))
      .map(([path]) => path);
    expect(hits).toEqual([]);
  });
});
