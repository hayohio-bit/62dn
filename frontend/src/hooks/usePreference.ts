import { useSyncExternalStore } from "react";
import { preferenceStore, savePreference } from "@/lib/preference";

/** 저장된 선호 조건(없으면 null). 어느 화면에서 바꿔도 함께 갱신된다 */
export function usePreference() {
  const preference = useSyncExternalStore(preferenceStore.subscribe, preferenceStore.snapshot);
  return { preference, savePreference };
}
