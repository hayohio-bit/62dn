/** 입양 선호 조건 (브라우저 localStorage, 기기마다 따로 저장). 로그인 없이 쓴다. */
import { createLocalStore } from "@/lib/localStore";
import type { PreferenceRequest } from "@/types/dto";

export const PREFERENCE_KEY = "dn:preference";

/** 알려진 값만 남기고 비어 있으면 null (조건이 하나도 없으면 설정하지 않은 것으로 본다) */
export function normalizePreference(raw: unknown): PreferenceRequest | null {
  if (raw == null || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const p: PreferenceRequest = {};
  if (r.species === "DOG" || r.species === "CAT") p.species = r.species;
  if (r.size === "SMALL" || r.size === "MEDIUM" || r.size === "LARGE") p.size = r.size;
  if (Number.isInteger(r.minAge) && (r.minAge as number) >= 0) p.minAge = r.minAge as number;
  if (Number.isInteger(r.maxAge) && (r.maxAge as number) >= 0) p.maxAge = r.maxAge as number;
  if (Array.isArray(r.regions)) {
    const regions = r.regions.filter((v): v is string => typeof v === "string" && v.trim() !== "").map((v) => v.trim());
    if (regions.length > 0) p.regions = Array.from(new Set(regions));
  }
  return Object.keys(p).length > 0 ? p : null;
}

export const preferenceStore = createLocalStore<PreferenceRequest | null>(PREFERENCE_KEY, null, normalizePreference);

export function savePreference(pref: PreferenceRequest): PreferenceRequest | null {
  const normalized = normalizePreference(pref);
  preferenceStore.write(normalized);
  return normalized;
}
