import { describe, expect, it, vi } from "vitest";
import { buildUrl, fetchAnimals, fetchKindMap, fetchKindMapOrEmpty, maskServiceKey, parseItems } from "./public-api.mjs";

const ok = (body) => ({ ok: true, status: 200, text: async () => (typeof body === "string" ? body : JSON.stringify(body)) });
const page = (items) => ({
  response: { header: { resultCode: "00" }, body: { items: items.length === 0 ? "" : { item: items } } },
});

describe("응답 해석", () => {
  it("item 배열을 돌려준다", () => {
    expect(parseItems(JSON.stringify(page([{ desertionNo: "1" }, { desertionNo: "2" }])))).toEqual([
      { desertionNo: "1" },
      { desertionNo: "2" },
    ]);
  });

  it("item이 하나면 객체로 오므로 배열로 감싼다", () => {
    const json = JSON.stringify({ response: { header: {}, body: { items: { item: { desertionNo: "1" } } } } });
    expect(parseItems(json)).toEqual([{ desertionNo: "1" }]);
  });

  it("정상 응답에 결과가 0건이면 items가 빈 문자열로 오고 빈 배열이다", () => {
    expect(parseItems(JSON.stringify(page([])))).toEqual([]);
  });

  it("인증 오류 XML은 사유 코드를 담아 실패한다", () => {
    const xml =
      "<OpenAPI_ServiceResponse><cmmMsgHeader><errMsg>SERVICE ERROR</errMsg>" +
      "<returnAuthMsg>SERVICE_KEY_IS_NOT_REGISTERED_ERROR</returnAuthMsg>" +
      "<returnReasonCode>30</returnReasonCode></cmmMsgHeader></OpenAPI_ServiceResponse>";
    expect(() => parseItems(xml)).toThrow("SERVICE_KEY_IS_NOT_REGISTERED_ERROR");
  });

  it("인증 오류가 JSON으로 와도 실패한다 (2026-10-30 실제 응답 형식)", () => {
    const json = JSON.stringify({
      OpenAPI_ServiceResponse: { cmmMsgHeader: { errMsg: "SERVICE_KEY_IS_NOT_REGISTERED_ERROR", returnAuthMsg: "등록되지 않은 서비스키", returnReasonCode: "30" } },
    });
    expect(() => parseItems(json)).toThrow("SERVICE_KEY_IS_NOT_REGISTERED_ERROR");
  });

  it("body 없이 오류 resultCode만 오면 실패한다", () => {
    const json = JSON.stringify({ response: { header: { resultCode: "22", resultMsg: "LIMITED NUMBER OF SERVICE REQUESTS EXCEEDS ERROR." } } });
    expect(() => parseItems(json)).toThrow("resultCode=22");
  });

  it("오류 resultCode가 빈 body와 함께 와도 0건이 아니라 실패다 (codex 리뷰 지적)", () => {
    const json = JSON.stringify({ response: { header: { resultCode: "22", resultMsg: "LIMITED" }, body: {} } });
    expect(() => parseItems(json)).toThrow("resultCode=22");
    const withItems = JSON.stringify({ response: { header: { resultCode: "99" }, body: { items: { item: [{ desertionNo: "1" }] } } } });
    expect(() => parseItems(withItems)).toThrow("resultCode=99");
  });

  it("한도 초과 응답이 2페이지에서 오면 일부 데이터로 끝내지 않고 실패한다", async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(ok(page([{ desertionNo: "1" }, { desertionNo: "2" }])))
      .mockResolvedValueOnce(ok({ response: { header: { resultCode: "22", resultMsg: "LIMITED" }, body: {} } }));
    await expect(fetchAnimals({ fetchImpl, serviceKey: "k", upkind: "417000", numOfRows: 2 })).rejects.toThrow("resultCode=22");
  });

  it("빈 응답과 해석할 수 없는 응답은 실패한다", () => {
    expect(() => parseItems("")).toThrow("비어");
    expect(() => parseItems("<html>")).toThrow("해석할 수 없습니다");
    expect(() => parseItems("[]")).toThrow("형식");
  });
});

describe("호출", () => {
  it("URL에 비어 있지 않은 파라미터만 넣고, 오류 메시지의 서비스 키를 가린다", () => {
    const url = buildUrl("https://x", "/p", { serviceKey: "abc+/=", pageNo: 1, upkind: null, state: "", _type: "json" });
    expect(url.searchParams.get("serviceKey")).toBe("abc+/=");
    expect(url.searchParams.has("upkind")).toBe(false);
    expect(url.searchParams.has("state")).toBe(false);
    expect(maskServiceKey("https://x/p?serviceKey=abc%2B&pageNo=1")).toBe("https://x/p?serviceKey=***&pageNo=1");
  });

  it("한 페이지가 numOfRows보다 적게 올 때까지 페이지를 넘긴다", async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(ok(page([{ desertionNo: "1" }, { desertionNo: "2" }])))
      .mockResolvedValueOnce(ok(page([{ desertionNo: "3" }])));
    const pages = [];
    const items = await fetchAnimals({ fetchImpl, serviceKey: "k", upkind: "417000", numOfRows: 2, onPage: (p) => pages.push(p) });
    expect(items.map((i) => i.desertionNo)).toEqual(["1", "2", "3"]);
    expect(pages).toEqual([
      { upkind: "417000", pageNo: 1, count: 2 },
      { upkind: "417000", pageNo: 2, count: 1 },
    ]);
    const firstUrl = fetchImpl.mock.calls[0][0];
    expect(firstUrl.pathname).toBe("/1543061/abandonmentPublicService_v2/abandonmentPublic_v2");
    expect(firstUrl.searchParams.get("state")).toBe("notice");
    expect(firstUrl.searchParams.get("numOfRows")).toBe("2");
    expect(firstUrl.searchParams.has("bgnde")).toBe(false);
    expect(fetchImpl.mock.calls[1][0].searchParams.get("pageNo")).toBe("2");
  });

  it("날짜 범위를 주면 bgnde·endde를 보낸다", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(ok(page([])));
    await fetchAnimals({ fetchImpl, serviceKey: "k", upkind: "417000", bgnde: "20261001", endde: "20261030" });
    const url = fetchImpl.mock.calls[0][0];
    expect(url.searchParams.get("bgnde")).toBe("20261001");
    expect(url.searchParams.get("endde")).toBe("20261030");
  });

  it("HTTP 오류는 상태 코드를 담아 실패하고 키를 노출하지 않는다", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: false, status: 500, text: async () => "serviceKey=secret 오류" });
    await expect(fetchAnimals({ fetchImpl, serviceKey: "secret", upkind: "417000" })).rejects.toThrow(/HTTP 500(?!.*secret)/);
  });

  it("품종 코드표는 두 축종을 합친 Map이다", async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(ok(page([{ kindCd: "000114", kNm: "말티즈" }, { kindCd: " ", kNm: "없음" }])))
      .mockResolvedValueOnce(ok(page([{ kindCd: "000200", kNm: " 코리안숏헤어 " }])));
    const map = await fetchKindMap({ fetchImpl, serviceKey: "k", upkinds: ["417000", "422400"] });
    expect([...map.entries()]).toEqual([
      ["000114", "말티즈"],
      ["000200", "코리안숏헤어"],
    ]);
    expect(fetchImpl.mock.calls[0][0].pathname).toBe("/1543061/abandonmentPublicService_v2/kind_v2");
  });

  it("품종명 필드가 knm·kindNm으로 와도 읽는다", async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(ok(page([{ kindCd: "1", knm: "푸들" }, { kindCd: "2", kindNm: "시츄" }])))
      .mockResolvedValueOnce(ok(page([])));
    const map = await fetchKindMap({ fetchImpl, serviceKey: "k", upkinds: ["417000", "422400"] });
    expect([...map.entries()]).toEqual([["1", "푸들"], ["2", "시츄"]]);
  });

  it("품종 조회가 거부돼도(존재하지 않는 주소 등) 빈 표로 계속하고 키는 가려서 경고한다", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => "NO_OPENAPI_SERVICE_ERROR serviceKey=secret",
    });
    const warn = vi.fn();
    const map = await fetchKindMapOrEmpty({ fetchImpl, serviceKey: "secret", upkinds: ["417000"] }, warn);
    expect(map.size).toBe(0);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain("HTTP 400");
    expect(warn.mock.calls[0][0]).not.toContain("secret");
  });

  it("동물 목록 조회 거부는 품종표와 달리 실패로 남는다", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: false, status: 400, text: async () => "NO_OPENAPI_SERVICE_ERROR" });
    await expect(fetchAnimals({ fetchImpl, serviceKey: "k", upkind: "417000" })).rejects.toThrow("HTTP 400");
  });
});
