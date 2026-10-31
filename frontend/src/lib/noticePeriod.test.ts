import { describe, expect, it } from "vitest";
import { DEFAULT_NOTICE_DAYS, MAX_NOTICE_BASIS_DAYS, noticeRemaining } from "./noticePeriod";

const base = { noticeStartDate: "2026-10-20", noticeEndDate: "2026-10-30" }; // 공고 기간 10일

describe("공고 기간 남은 비율", () => {
  it("남은 일수를 공고 기간 길이로 나눈 비율과 단계를 돌려준다", () => {
    expect(noticeRemaining({ ...base, daysUntilExpiry: 9 })).toMatchObject({ ratio: 0.9, level: "plenty" });
    expect(noticeRemaining({ ...base, daysUntilExpiry: 6 })).toMatchObject({ ratio: 0.6, level: "plenty" });
  });

  it("절반(0.5)부터 0.2 초과까지는 절반쯤이다", () => {
    expect(noticeRemaining({ ...base, daysUntilExpiry: 5 })).toMatchObject({ ratio: 0.5, level: "half" });
    expect(noticeRemaining({ ...base, daysUntilExpiry: 3 })).toMatchObject({ ratio: 0.3, level: "half" });
  });

  it("0.2 이하는 얼마 남지 않음이고 오늘까지(0일)도 막대가 남는다", () => {
    expect(noticeRemaining({ ...base, daysUntilExpiry: 2 })).toMatchObject({ ratio: 0.2, level: "short" });
    expect(noticeRemaining({ ...base, daysUntilExpiry: 0 })).toMatchObject({ ratio: 0, level: "short" });
  });

  it("공고 기간이 끝났으면(음수) ended다", () => {
    expect(noticeRemaining({ ...base, daysUntilExpiry: -1 })).toMatchObject({ ratio: 0, level: "ended" });
  });

  it("비율은 0~1로 자른다 (공고 기간보다 많이 남은 경우)", () => {
    expect(noticeRemaining({ ...base, daysUntilExpiry: 40 })).toMatchObject({ ratio: 1, level: "plenty" });
  });

  it("공고 기간이 아주 길어도 기준은 상한(15일)까지만 쓴다 (8일 남았는데 얼마 남지 않음으로 보이지 않게)", () => {
    expect(MAX_NOTICE_BASIS_DAYS).toBe(15);
    const long = { noticeStartDate: "2026-09-20", noticeEndDate: "2026-10-31" }; // 41일
    expect(noticeRemaining({ ...long, daysUntilExpiry: 8 })).toMatchObject({ level: "plenty" }); // 8/15 > 0.5 (상한이 없으면 8/41로 short)
    expect(noticeRemaining({ ...long, daysUntilExpiry: 7 })).toMatchObject({ level: "half" });
    expect(noticeRemaining({ ...long, daysUntilExpiry: 3 })).toMatchObject({ level: "short" });
    expect(noticeRemaining({ ...long, daysUntilExpiry: 30 })).toMatchObject({ ratio: 1, level: "plenty" });
    // 상한 안의 기간은 그대로: 12일 공고에서 6일 남으면 절반
    expect(noticeRemaining({ noticeStartDate: "2026-10-19", noticeEndDate: "2026-10-31", daysUntilExpiry: 6 })).toMatchObject({ ratio: 0.5 });
  });

  it("공고 시작·종료일이 없으면 기본 공고 기간(10일)을 쓴다", () => {
    expect(DEFAULT_NOTICE_DAYS).toBe(10);
    expect(noticeRemaining({ daysUntilExpiry: 5 })).toMatchObject({ ratio: 0.5, level: "half" });
    expect(noticeRemaining({ daysUntilExpiry: 5, noticeEndDate: "2026-10-30" })).toMatchObject({ ratio: 0.5 });
  });

  it("공고 기간 길이가 0 이하이면 기본값으로 계산한다", () => {
    expect(noticeRemaining({ daysUntilExpiry: 5, noticeStartDate: "2026-10-30", noticeEndDate: "2026-10-30" })).toMatchObject({
      ratio: 0.5,
    });
  });

  it("남은 일수를 모르면 null이다 (막대를 그리지 않는다)", () => {
    expect(noticeRemaining({})).toBeNull();
    expect(noticeRemaining({ daysUntilExpiry: null })).toBeNull();
  });

  it("단계마다 숫자 없는 설명 문구를 준다", () => {
    const labels = [9, 5, 1, -1].map((d) => noticeRemaining({ ...base, daysUntilExpiry: d })?.label);
    expect(labels).toEqual([
      "공고 기간이 넉넉히 남아 있어요",
      "공고 기간이 절반쯤 남았어요",
      "공고 기간이 얼마 남지 않았어요",
      "공고 기간이 끝났어요",
    ]);
    for (const l of labels) expect(l).not.toMatch(/\d/);
  });
});
