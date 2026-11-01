import { describe, expect, it } from "vitest";
import indexHtml from "../../../index.html?raw";

/**
 * 개인정보 처리방침(PrivacyPage)이 말하는 사실이 코드와 어긋나지 않게 지키는 점검.
 * 이 테스트가 실패하면 코드를 바꾼 것이므로 PrivacyPage의 표와 문구, INFO_EFFECTIVE_DATE를 함께 고친다.
 */
const sources = import.meta.glob(["../../**/*.ts", "../../**/*.tsx", "!../../**/*.test.ts", "!../../**/*.test.tsx", "!../../**/*.d.ts"], {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;
const allCode = Object.values(sources).join("\n");
const codeWithHtml = `${allCode}\n${indexHtml}`;

/** 접속하거나 링크로 연결되는 외부 도메인. 새 도메인을 쓰면 처리방침의 외부 서비스 표(또는 링크 안내)에 추가하고 여기에도 넣는다 */
const ALLOWED_HOSTS = [
  "fonts.googleapis.com", // 글꼴 (접속 때 연결)
  "fonts.gstatic.com", // 글꼴 파일 (접속 때 연결)
  "cdn.jsdelivr.net", // Pretendard 글꼴 (접속 때 연결)
  "dapi.kakao.com", // 카카오 지도 SDK (지도 화면에서만 연결)
  "map.kakao.com", // 카카오맵 길찾기 링크 (클릭할 때만 이동)
  "www.animal.go.kr", // 출처·안내 링크
  "apms.epis.or.kr", // 동물사랑배움터 링크
  "github.com", // 문의 창구 링크
  "hayohio-bit.github.io", // 이 사이트의 주소
];

describe("개인정보 처리방침과 코드의 일치", () => {
  it("브라우저 저장소 키는 처리방침에 적은 다섯 가지뿐이다", () => {
    const localKeys = [...codeWithHtml.matchAll(/"(dn:[a-z-]+)"/g)].map((m) => m[1]);
    expect(new Set(localKeys)).toEqual(new Set(["dn:favorites", "dn:preference", "dn:recent-animals", "dn:chunk-reload"]));
    const sessionSetItems = [...allCode.matchAll(/sessionStorage\.setItem\(\s*(?:"([^"]+)"|([A-Z_]+))/g)].map((m) => m[1] ?? m[2]);
    expect(new Set(sessionSetItems)).toEqual(new Set(["scrollPositions", "RELOAD_KEY"]));
  });

  it("쿠키를 설정하거나 읽는 코드가 없다", () => {
    expect(allCode).not.toMatch(/document\.cookie/);
  });

  it("분석·추적 도구가 없다", () => {
    expect(codeWithHtml).not.toMatch(/gtag|googletagmanager|google-analytics|analytics\.js|hotjar|clarity\.ms|sendBeacon/i);
  });

  it("서버로 보내는 요청은 같은 사이트의 데이터 스냅샷을 받는 fetch 한 곳뿐이다", () => {
    const fetches = Object.entries(sources).filter(([, code]) => /\bfetch\(/.test(code));
    expect(fetches.map(([path]) => path)).toEqual(["../../data/snapshot.ts"]);
    expect(allCode).not.toMatch(/XMLHttpRequest|axios/);
  });

  it("코드와 index.html이 가리키는 외부 도메인은 허용 목록 안에 있다", () => {
    const hosts = new Set([...codeWithHtml.matchAll(/https?:\/\/([a-z0-9.-]+)/gi)].map((m) => m[1].toLowerCase()));
    for (const ignorable of ["www.w3.org", "img"]) hosts.delete(ignorable); // SVG 네임스페이스, 테스트 픽스처 아님
    expect([...hosts].filter((h) => !ALLOWED_HOSTS.includes(h))).toEqual([]);
  });
});
