package com.dnproject.platform.controller;

import com.dnproject.platform.domain.constant.SyncTriggerType;
import com.dnproject.platform.dto.response.ApiResponse;
import com.dnproject.platform.dto.response.PageResponse;
import com.dnproject.platform.exception.CustomException;
import com.dnproject.platform.service.AnimalService;
import com.dnproject.platform.service.AnimalSyncService;
import com.dnproject.platform.service.PublicApiService;
import com.dnproject.platform.service.SyncHistoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 관리자 전용 - 동물 공공API 동기화 및 동기화 이력 //
 */
@Tag(name = "Admin - Animal", description = "관리자 동물 API")
@RestController
@RequestMapping("/api/admin/animals")
@RequiredArgsConstructor
@Slf4j
public class AdminAnimalController {

        private final AnimalService animalService;
        private final PublicApiService publicApiService;
        private final SyncHistoryService syncHistoryService;

        @Operation(summary = "공공데이터 유기동물 동기화")
        @PostMapping("/sync-from-public-api")
        public ApiResponse<Map<String, Object>> syncFromPublicApi(
                        @RequestParam(defaultValue = "7") int days,
                        @RequestParam(required = false) Integer maxPages,
                        @RequestParam(required = false) String species) {
                boolean apiKeyConfigured = publicApiService.isApiKeyConfigured();
                String speciesFilter = species != null ? species : "ALL";
                AnimalSyncService.SyncResult result;
                try {
                        result = animalService.syncFromPublicApiWithStatus(days, maxPages, species);
                } catch (Exception e) {
                        // 예외는 GlobalExceptionHandler가 기록하고 일반 오류 문구로 응답한다.
                        syncHistoryService.save(new AnimalSyncService.SyncResult(0, 0, 0),
                                        SyncTriggerType.MANUAL, days, speciesFilter, "동기화 중 서버 오류가 발생했습니다.");
                        throw new RuntimeException("API 동기화 중 오류 발생", e);
                }

                String errorMessage = syncErrorMessage(result, apiKeyConfigured);
                syncHistoryService.save(result, SyncTriggerType.MANUAL, days, speciesFilter, errorMessage);

                // 모든 API 호출이 실패하면 받은 데이터가 없으므로 오류로 응답한다 (관리자 화면이 오류 메시지를 표시한다).
                if (result.completelyFailed()) {
                        throw new CustomException(errorMessage, HttpStatus.BAD_GATEWAY, "PUBLIC_API_SYNC_FAILED");
                }

                Map<String, Object> data = new LinkedHashMap<>();
                data.put("addedCount", result.addedCount());
                data.put("updatedCount", result.updatedCount());
                data.put("syncedCount", result.syncedCount());
                data.put("removedCount", result.removedCount());
                data.put("days", days);
                data.put("species", speciesFilter);
                data.put("apiKeyConfigured", apiKeyConfigured);
                data.put("success", apiKeyConfigured && !result.hasFailures());
                data.put("failedRequestCount", result.failedRequestCount());
                if (errorMessage != null) {
                        data.put("errorMessage", errorMessage);
                }
                return ApiResponse.success(result.hasFailures() ? "동기화 일부 실패" : "동기화 완료", data);
        }

        /** 동기화 이력과 응답에 남길 실패 사유. 실패가 없으면 null */
        private static String syncErrorMessage(AnimalSyncService.SyncResult result, boolean apiKeyConfigured) {
                if (!apiKeyConfigured) {
                        return "공공 API 키가 설정되지 않아 동기화하지 않았습니다.";
                }
                return result.failureSummary();
        }

        @Operation(summary = "동기화 실행 후 비보호 상태 동물 일괄 정리 (입양·안락사·반환 등)")
        @DeleteMapping("/cleanup-invalid")
        public ApiResponse<Map<String, Object>> cleanupInvalidStatus(
                        @RequestParam(defaultValue = "30") int days) {
                int syncRemoved = 0, syncAdded = 0, syncUpdated = 0;
                String syncError = null;

                // 1) 먼저 동기화 실행 → 공공API에서 전체 상태 조회하여 비보호 동물 삭제
                try {
                        var syncResult = animalService.syncFromPublicApiWithStatus(days, null, null);
                        syncRemoved = syncResult.removedCount();
                        syncAdded = syncResult.addedCount();
                        syncUpdated = syncResult.updatedCount();
                        syncError = syncErrorMessage(syncResult, publicApiService.isApiKeyConfigured());
                } catch (Exception e) {
                        // 예외 메시지에는 SQL 등 내부 정보가 들어갈 수 있으므로 응답에는 일반 문구만 쓴다.
                        log.error("정리 전 동기화 중 예외", e);
                        syncError = "동기화 중 서버 오류가 발생했습니다.";
                }

                // 2) 혹시 남은 ADOPTED / NULL / 만료 상태 레코드도 정리
                int[] dbCleanup = animalService.cleanupInvalidStatus();
                int adoptedDeleted = dbCleanup[0];
                int nullDeleted = dbCleanup[1];
                int expiredDeleted = dbCleanup[2];

                int totalRemoved = syncRemoved + adoptedDeleted + nullDeleted + expiredDeleted;

                // 3) 이력 저장 (누락된 내역 추가)
                com.dnproject.platform.service.AnimalSyncService.SyncResult totalResult = new com.dnproject.platform.service.AnimalSyncService.SyncResult(
                                syncAdded, syncUpdated, totalRemoved);
                syncHistoryService.save(totalResult, SyncTriggerType.MANUAL, days, "ALL", syncError);

                String message = syncError != null
                                ? "동기화 일부 실패, DB 정리 완료 (" + syncError + ")"
                                : "동기화 + 정리 완료";
                return ApiResponse.success(message, Map.of(
                                "syncRemoved", syncRemoved,
                                "syncAdded", syncAdded,
                                "syncUpdated", syncUpdated,
                                "adoptedDeleted", adoptedDeleted,
                                "nullDeleted", nullDeleted,
                                "expiredDeleted", expiredDeleted,
                                "totalRemoved", totalRemoved));
        }

        @Operation(summary = "동기화 이력 목록 (자동/수동, 추가·수정·삭제·보정 건수)")
        @GetMapping("/sync-history")
        public ApiResponse<PageResponse<SyncHistoryResponse>> getSyncHistory(
                        @RequestParam(defaultValue = "0") int page,
                        @RequestParam(defaultValue = "20") int size) {
                var p = syncHistoryService.getHistory(PageRequest.of(page, size));
                var content = p.getContent().stream()
                                .map(h -> new SyncHistoryResponse(
                                                h.getId(),
                                                h.getCreatedAt().toString(),
                                                h.getTriggerType().name(),
                                                h.getAddedCount(),
                                                h.getUpdatedCount(),
                                                h.getDeletedCount(),
                                                h.getCorrectedCount(),
                                                h.getErrorMessage(),
                                                h.getDaysParam(),
                                                h.getSpeciesFilter()))
                                .toList();
                return ApiResponse.success("OK", PageResponse.<SyncHistoryResponse>builder()
                                .content(content)
                                .page(p.getNumber())
                                .size(p.getSize())
                                .totalElements(p.getTotalElements())
                                .totalPages(p.getTotalPages())
                                .first(p.isFirst())
                                .last(p.isLast())
                                .build());
        }

        public record SyncHistoryResponse(
                        Long id,
                        String runAt,
                        String triggerType,
                        int addedCount,
                        int updatedCount,
                        int deletedCount,
                        int correctedCount,
                        String errorMessage,
                        Integer daysParam,
                        String speciesFilter) {
        }
}
