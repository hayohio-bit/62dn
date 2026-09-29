package com.dnproject.platform.controller;

import com.dnproject.platform.dto.response.ApiResponse;
import com.dnproject.platform.dto.response.PublicShelterResponse;
import com.dnproject.platform.service.ShelterService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Public - Shelter", description = "일반 사용자 보호소(후원/봉사) API")
@RestController
@RequestMapping("/api/shelters")
@RequiredArgsConstructor
public class PublicShelterController {

    private final ShelterService shelterService;

    @Operation(summary = "일반 보호소 목록 검색")
    @GetMapping
    public ApiResponse<Page<PublicShelterResponse>> searchPublicShelters(
            @RequestParam(required = false) String regionSido,
            @RequestParam(required = false) String keyword,
            @PageableDefault(size = 10, sort = "id", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<PublicShelterResponse> data = shelterService.searchPublicShelters(regionSido, keyword, pageable);
        return ApiResponse.success("조회 성공", data);
    }

    @Operation(summary = "보호소 상세 조회")
    @GetMapping("/{id}")
    public ApiResponse<PublicShelterResponse> getPublicShelter(@PathVariable Long id) {
        return ApiResponse.success("조회 성공", shelterService.getPublicById(id));
    }
}
