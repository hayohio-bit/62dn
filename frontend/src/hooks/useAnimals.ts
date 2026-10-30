import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { animalApi, preferenceApi } from "@/api";
import { usePreference } from "@/hooks/usePreference";
import type { Animal } from "@/types/entities";
import type { PreferenceRequest } from "@/types/dto";

export type ViewMode = "all" | "recommended";

export function useAnimals() {
  const { preference, savePreference } = usePreference();
  const [searchParams, setSearchParams] = useSearchParams();

  // --- URL searchParams에서 상태 읽기 ---
  const page = Number(searchParams.get("page") || "0");
  const species = (searchParams.get("species") || "") as "DOG" | "CAT" | "";
  const size = (searchParams.get("size") || "") as "SMALL" | "MEDIUM" | "LARGE" | "";
  const gender = (searchParams.get("gender") || "") as "MALE" | "FEMALE" | "";
  const status = (searchParams.get("status") || "PROTECTED") as "PROTECTED" | "FOSTERING" | "";
  const region = searchParams.get("region") || "";
  const sigungu = searchParams.get("sigungu") || "";
  const sort = searchParams.get("sort") || "noticeEndDate,asc";
  const pageSize = Number(searchParams.get("pageSize") || "12");

  // --- URL에 반영하지 않는 로컬 상태 ---
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const [search, setSearch] = useState("");
  const [showPreferenceModal, setShowPreferenceModal] = useState(false);
  const [apiAnimals, setApiAnimals] = useState<Animal[]>([]);
  const [apiTotalElements, setApiTotalElements] = useState(0);

  const totalPages = Math.ceil(apiTotalElements / pageSize) || 1;

  // --- searchParams 업데이트 헬퍼: 기본값이면 파라미터 제거 ---
  const updateParams = useCallback((updates: Record<string, string>) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      for (const [key, value] of Object.entries(updates)) {
        const isDefault =
          (key === "page" && value === "0") ||
          (key === "species" && value === "") ||
          (key === "size" && value === "") ||
          (key === "gender" && value === "") ||
          (key === "status" && value === "PROTECTED") ||
          (key === "region" && value === "") ||
          (key === "sigungu" && value === "") ||
          (key === "sort" && value === "noticeEndDate,asc") ||
          (key === "pageSize" && value === "12");
        if (isDefault) {
          next.delete(key);
        } else {
          next.set(key, value);
        }
      }
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  // --- setter 래퍼: URL 파라미터도 함께 업데이트 ---
  const setPage = useCallback((p: number) => updateParams({ page: String(p) }), [updateParams]);
  const setSpecies = useCallback((v: "DOG" | "CAT" | "") => updateParams({ species: v, page: "0" }), [updateParams]);
  const setSize = useCallback((v: "SMALL" | "MEDIUM" | "LARGE" | "") => updateParams({ size: v, page: "0" }), [updateParams]);
  const setGender = useCallback((v: "MALE" | "FEMALE" | "") => updateParams({ gender: v, page: "0" }), [updateParams]);
  const setStatus = useCallback((v: "PROTECTED" | "FOSTERING" | "") => updateParams({ status: v, page: "0" }), [updateParams]);
  const setRegion = useCallback((v: string) => updateParams({ region: v, sigungu: "", page: "0" }), [updateParams]);
  const setSigungu = useCallback((v: string) => updateParams({ sigungu: v, page: "0" }), [updateParams]);
  const setSort = useCallback((v: string) => updateParams({ sort: v, page: "0" }), [updateParams]);
  const setPageSize = useCallback((s: number) => updateParams({ pageSize: String(s), page: "0" }), [updateParams]);

  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => clearTimeout(id);
  }, [search]);

  useEffect(() => {
    if (viewMode === "recommended" && !preference) {
      setApiAnimals([]);
      setApiTotalElements(0);
      setLoading(false);
      return;
    }
    // 필터·탭을 빠르게 바꾸면 이전 요청의 응답이 늦게 도착해 최신 결과를 덮어쓸 수 있으므로,
    // effect가 정리된 뒤 도착한 응답은 버린다.
    let cancelled = false;
    setLoading(true);
    setError(null);
    const load = async () => {
      try {
        if (viewMode === "recommended") {
           const data = await preferenceApi.getRecommendedAnimals(page, pageSize);
           if (cancelled) return;
           setApiAnimals(data?.content ?? []);
           setApiTotalElements(data?.totalElements ?? 0);
        } else {
           const data = await animalApi.getAll({
             page, sizeParam: pageSize, species: species || undefined, animalSize: size || undefined,
             gender: gender || undefined,
             status: status || undefined, region: region || undefined, sigungu: sigungu || undefined,
             search: debouncedSearch || undefined, sort,
           });
           if (cancelled) return;
           const content = data?.content ?? [];
           const total = data?.totalElements ?? content.length;
           setApiAnimals(content);
           setApiTotalElements(total);
        }
      } catch (err: unknown) {
        if (cancelled) return;
        // 스냅샷 파일(public/data/snapshot.json)을 받지 못한 경우가 대부분이라 원인(HTTP 상태 등)을 함께 안내한다
        const reason = err instanceof Error && err.message ? ` (${err.message})` : "";
        setError(`${viewMode === "recommended" ? "추천" : "동물"} 목록을 불러올 수 없습니다.${reason}`);
        setApiAnimals([]);
        setApiTotalElements(0);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [viewMode, page, pageSize, species, size, gender, status, region, sigungu, sort, debouncedSearch, preference]);

  // 검색어가 실제로 바뀐 경우에만 첫 페이지로 이동한다.
  // setPage는 URL이 바뀔 때마다 새로 만들어지므로, 의존성 변화만으로 실행하면
  // 검색 중 페이지 이동이 곧바로 0페이지로 되돌아간다.
  const prevSearchRef = useRef(debouncedSearch);
  useEffect(() => {
    if (prevSearchRef.current === debouncedSearch) return;
    prevSearchRef.current = debouncedSearch;
    setPage(0);
  }, [debouncedSearch, setPage]);

  const handleSavePreference = (pref: PreferenceRequest) => {
    savePreference(pref);
    setViewMode("recommended");
    setShowPreferenceModal(false);
    setPage(0);
  };

  const resetFilters = () => {
    setSearch("");
    setViewMode("all");
    setSearchParams({}, { replace: true });
  };

  return {
    state: {
      loading, error, viewMode, search, species, size, gender, status, region, sigungu,
      sort, page, pageSize, preference, showPreferenceModal,
      animals: apiAnimals, totalPages, apiTotalElements
    },
    actions: {
      setViewMode, setSearch, setSpecies, setSize, setGender, setStatus, setRegion, setSigungu,
      setSort, setPage, setPageSize, setShowPreferenceModal, handleSavePreference, resetFilters
    }
  };
}
