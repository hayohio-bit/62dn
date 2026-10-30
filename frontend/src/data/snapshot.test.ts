import { afterEach, describe, expect, it, vi } from "vitest";
import { SNAPSHOT_URL, loadSnapshot, resetSnapshotCache } from "./snapshot";

const response = (ok: boolean, body: unknown) =>
  ({ ok, status: ok ? 200 : 500, json: async () => body }) as unknown as Response;

describe("스냅샷 로더", () => {
  afterEach(() => {
    resetSnapshotCache();
    vi.unstubAllGlobals();
  });

  it("BASE_URL 아래 data/snapshot.json을 한 번만 받아 재사용한다", async () => {
    const fetchMock = vi.fn().mockResolvedValue(response(true, { version: 1, animals: [], shelters: [] }));
    vi.stubGlobal("fetch", fetchMock);
    const [a, b] = await Promise.all([loadSnapshot(), loadSnapshot()]);
    expect(a).toBe(b);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(SNAPSHOT_URL);
    expect(SNAPSHOT_URL.endsWith("/data/snapshot.json")).toBe(true);
  });

  it("실패하면 오류를 던지고 다음 호출에서 다시 요청한다", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(response(false, null)).mockResolvedValueOnce(response(true, { version: 1, animals: [], shelters: [] }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(loadSnapshot()).rejects.toThrow("HTTP 500");
    await expect(loadSnapshot()).resolves.toMatchObject({ version: 1 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
