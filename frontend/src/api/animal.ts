/**
 * Animal API 모듈
 * 동물 목록 조회, 상세 조회, 긴급 동물 조회
 */

import axiosInstance from "@/lib/axios";
import type {
  AnimalListRequest,
  AnimalResponse,
  AnimalListResponse,
  ApiResponse,
} from "@/types/dto";

export const animalApi = {
  /**
   * 동물 목록 조회
   */
  getAll: async (params?: AnimalListRequest) => {
    const response = await axiosInstance.get<ApiResponse<AnimalListResponse>>(
      "/animals",
      {
        params,
      },
    );
    return response.data.data;
  },

  /**
   * 동물 상세 조회
   */
  getById: async (id: number) => {
    const response = await axiosInstance.get<ApiResponse<AnimalResponse>>(
      `/animals/${id}`,
    );
    return response.data.data;
  },

  /**
   * 안락사 D-Day 임박 동물 목록 (렌딩 페이지용)
   */
  getUrgentAnimals: async (limit: number = 10) => {
    const response = await axiosInstance.get<ApiResponse<AnimalResponse[]>>(
      "/animals/urgent",
      { params: { limit } }
    );
    return response.data.data;
  },
};
