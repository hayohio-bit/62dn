/**
 * Animal API 모듈
 * 동물 목록 조회, 상세 조회, 등록(보호소)
 */

import axiosInstance from "@/lib/axios";
import type {
  AnimalListRequest,
  AnimalResponse,
  AnimalListResponse,
  AnimalCreateRequest,
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

  /**
   * 동물 등록 (입양 게시판 수동 등록, 보호소)
   */
  create: async (data: AnimalCreateRequest) => {
    const response = await axiosInstance.post<ApiResponse<AnimalResponse>>(
      "/animals",
      data,
    );
    return response.data.data;
  },
};
