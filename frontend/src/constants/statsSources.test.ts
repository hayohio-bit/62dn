import { describe, expect, it } from "vitest";
import { statsSources } from "./landingContent";

describe("통계 출처 표기", () => {
  it("출처마다 이름, 게시일, 원문 링크가 따로 있다 (게시일은 줄바꿈 때 끊기지 않게 따로 다룬다)", () => {
    expect(statsSources.length).toBeGreaterThanOrEqual(2);
    for (const s of statsSources) {
      expect(s.label).not.toMatch(/\(|\)/);
      expect(s.published).toMatch(/^\d{4}\. \d{1,2}\. \d{1,2}\. 게시$/);
      expect(s.href).toMatch(/^https:\/\/www\.animal\.go\.kr\//);
    }
  });
});
