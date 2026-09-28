import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import { animalApi, preferenceApi, favoriteApi } from "@/api";
import { useAuthStore } from "@/store/authStore";
import type { Animal } from "@/types/entities";
import type { PreferenceRequest } from "@/types/dto";

export type ViewMode = "all" | "recommended";

export function useAnimals() {
  const { isAuthenticated } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();

  // --- URL searchParams에서 상태 읽기 ---
  const page = Number(searchParams.get("page") || "0");
  const species = (searchParams.get("species") || "") as "DOG" | "CAT" | "";
  const size = (searchParams.get("size") || "") as "SMALL" | "MEDIUM" | "LARGE" | "";
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
  const [preference, setPreference] = useState<PreferenceRequest | null>(null);
  const [showPreferenceModal, setShowPreferenceModal] = useState(false);
  const [apiAnimals, setApiAnimals] = useState<Animal[]>([]);
  const [apiTotalElements, setApiTotalElements] = useState(0);
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);

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
  const setStatus = useCallback((v: "PROTECTED" | "FOSTERING" | "") => updateParams({ status: v, page: "0" }), [updateParams]);
  const setRegion = useCallback((v: string) => updateParams({ region: v, sigungu: "", page: "0" }), [updateParams]);
  const setSigungu = useCallback((v: string) => updateParams({ sigungu: v, page: "0" }), [updateParams]);
  const setSort = useCallback((v: string) => updateParams({ sort: v, page: "0" }), [updateParams]);
  const setPageSize = useCallback((s: number) => updateParams({ pageSize: String(s), page: "0" }), [updateParams]);

  useEffect(() => {
    if (!isAuthenticated) {
      setFavoriteIds([]);
      return;
    }
    favoriteApi.getMyFavoriteIds().then(setFavoriteIds).catch(() => setFavoriteIds([]));
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      setPreference(null);
      return;
    }
    preferenceApi.getMy().then((data) => {
      if (data) {
        setPreference({
          species: data.species ?? undefined,
          minAge: data.minAge ?? undefined,
          maxAge: data.maxAge ?? undefined,
          size: data.size ?? undefined,
          regions: data.regions ?? [],
        });
      } else {
        setPreference(null);
      }
    }).catch(() => setPreference(null));
  }, [isAuthenticated]);

  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => clearTimeout(id);
  }, [search]);

  useEffect(() => {
    if (viewMode === "recommended" && !isAuthenticated) {
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
        const response = axios.isAxiosError<{ message?: string }>(err) ? err.response : undefined;
        const errStatus = response?.status;
        const serverMessage = response?.data?.message;
        let message: string;
        if (viewMode === "recommended") {
          message = "추천 목록을 불러오는데 실패했습니다. 로그인 후 선호도를 설정해 주세요.";
        } else if (errStatus == null) {
          message = "동물 목록을 불러올 수 없습니다. 서버에 연결할 수 있는지 확인해 주세요.";
        } else if (errStatus >= 500) {
          message = serverMessage ? `서버 오류: ${serverMessage}` : "동물 목록을 불러오는데 실패했습니다. (서버 오류)";
        } else {
          message = serverMessage ? `동물 목록을 불러오는데 실패했습니다. (${serverMessage})` : "동물 목록을 불러오는데 실패했습니다.";
        }
        setError(message);
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
  }, [viewMode, page, pageSize, species, size, status, region, sigungu, sort, debouncedSearch, isAuthenticated]);

  // 검색어가 실제로 바뀐 경우에만 첫 페이지로 이동한다.
  // setPage는 URL이 바뀔 때마다 새로 만들어지므로, 의존성 변화만으로 실행하면
  // 검색 중 페이지 이동이 곧바로 0페이지로 되돌아간다.
  const prevSearchRef = useRef(debouncedSearch);
  useEffect(() => {
    if (prevSearchRef.current === debouncedSearch) return;
    prevSearchRef.current = debouncedSearch;
    setPage(0);
  }, [debouncedSearch, setPage]);

  const handleSavePreference = async (pref: PreferenceRequest) => {
    try {
      await preferenceApi.update(pref);
      setPreference(pref);
      setViewMode("recommended");
      setShowPreferenceModal(false);
      setPage(0);
    } catch {
      alert("선호도 저장에 실패했습니다. 다시 시도해 주세요.");
    }
  };

  const resetFilters = () => {
    setSearch("");
    setViewMode("all");
    setSearchParams({}, { replace: true });
  };

  return {
    state: {
      loading, error, viewMode, search, species, size, status, region, sigungu,
      sort, page, pageSize, preference, showPreferenceModal, favoriteIds,
      animals: apiAnimals, totalPages, apiTotalElements
    },
    actions: {
      setViewMode, setSearch, setSpecies, setSize, setStatus, setRegion, setSigungu,
      setSort, setPage, setPageSize, setShowPreferenceModal, setFavoriteIds, handleSavePreference, resetFilters
    }
  };
}
