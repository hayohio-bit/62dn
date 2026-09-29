package com.dnproject.platform.controller;

import com.dnproject.platform.domain.constant.AnimalStatus;
import com.dnproject.platform.domain.constant.Gender;
import com.dnproject.platform.domain.constant.Size;
import com.dnproject.platform.domain.constant.Species;

import com.dnproject.platform.dto.response.AnimalResponse;
import com.dnproject.platform.dto.response.ApiResponse;
import com.dnproject.platform.dto.response.PageResponse;
import com.dnproject.platform.exception.UnauthorizedException;
import com.dnproject.platform.service.AnimalService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Set;

@Tag(name = "Animal", description = "동물 API")
@RestController
@RequestMapping("/api/animals")
@RequiredArgsConstructor
public class AnimalController {

    private final AnimalService animalService;

    @Operation(summary = "선호도 기반 추천 동물 목록 (인증 필요)")
    @GetMapping("/recommendations")
    public ApiResponse<PageResponse<AnimalResponse>> getRecommendations(
            HttpServletRequest request,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort) {
        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) {
            throw new UnauthorizedException("인증이 필요합니다.");
        }
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        PageResponse<AnimalResponse> data = animalService.findRecommended(userId, pageable);
        return ApiResponse.success("조회 성공", data);
    }

    /** 목록 정렬에 허용하는 필드. 그 밖의 값은 기본 정렬(공고 마감 임박순)로 처리한다. */
    private static final Set<String> SORTABLE_FIELDS = Set.of("noticeEndDate", "noticeStartDate", "createdAt");

    @Operation(summary = "동물 목록 조회")
    @GetMapping
    public ApiResponse<PageResponse<AnimalResponse>> getAll(
            @RequestParam(required = false) Species species,
            @RequestParam(required = false) AnimalStatus status,
            @RequestParam(name = "animalSize", required = false) Size animalSize,
            @RequestParam(required = false) Gender gender,
            @RequestParam(required = false) Long shelterId,
            @RequestParam(required = false) String region,
            @RequestParam(required = false) String sigungu,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int sizeParam,
            @RequestParam(defaultValue = "noticeEndDate,asc") String sort) {
        String searchParam = (search != null && !search.isBlank()) ? search.trim() : null;
        Pageable pageable = PageRequest.of(page, sizeParam, toListSort(sort));
        PageResponse<AnimalResponse> data = animalService.findAll(species, status, animalSize, gender, shelterId,
                region, sigungu, searchParam, pageable);
        return ApiResponse.success("조회 성공", data);
    }

    /**
     * "필드,방향" 형식의 정렬 값을 Sort로 바꾼다.
     * 날짜 필드는 값이 없는 동물이 앞에 오지 않도록 NULL을 뒤로 보내고, 같은 날짜끼리는 id 순으로 고정한다.
     */
    static Sort toListSort(String sort) {
        String[] parts = sort.split(",");
        String field = parts[0].trim();
        Sort.Direction direction = parts.length > 1 && "desc".equalsIgnoreCase(parts[1].trim())
                ? Sort.Direction.DESC
                : Sort.Direction.ASC;
        if (!SORTABLE_FIELDS.contains(field)) {
            field = "noticeEndDate";
            direction = Sort.Direction.ASC;
        }
        return Sort.by(new Sort.Order(direction, field, Sort.NullHandling.NULLS_LAST), Sort.Order.asc("id"));
    }

    @Operation(summary = "동물 상세 조회")
    @GetMapping("/{id}")
    public ApiResponse<AnimalResponse> getById(@PathVariable Long id) {
        AnimalResponse data = animalService.findById(id);
        return ApiResponse.success("조회 성공", data);
    }

    @Operation(summary = "안락사 D-Day 임박 동물 목록 (렌딩 페이지용)")
    @GetMapping("/urgent")
    public ApiResponse<List<AnimalResponse>> getUrgentAnimals(
            @RequestParam(defaultValue = "10") int limit) {
        List<AnimalResponse> data = animalService.findUrgentAnimals(limit);
        return ApiResponse.success("조회 성공", data);
    }

}
