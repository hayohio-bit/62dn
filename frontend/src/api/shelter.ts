import axiosInstance from "@/lib/axios";
import type { ApiResponse, PageResponse } from "@/types/dto";
import type { PublicShelterResponse } from "@/types/entities";

export const shelterApi = {
  getPublicShelters: (
    regionSido?: string,
    keyword?: string,
    page = 0,
    size = 10,
  ) => {
    return axiosInstance
      .get<ApiResponse<PageResponse<PublicShelterResponse>>>("/shelters", {
        params: {
          regionSido: regionSido || undefined,
          keyword: keyword || undefined,
          page,
          size,
        },
      })
      .then((res) => res.data.data);
  },

  /** 보호소 상세 (보호소 페이지용) */
  getPublicShelter: (id: number) =>
    axiosInstance.get<ApiResponse<PublicShelterResponse>>(`/shelters/${id}`).then((res) => res.data.data),
};
