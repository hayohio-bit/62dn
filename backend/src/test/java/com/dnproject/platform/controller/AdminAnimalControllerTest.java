package com.dnproject.platform.controller;

import com.dnproject.platform.domain.constant.SyncTriggerType;
import com.dnproject.platform.exception.GlobalExceptionHandler;
import com.dnproject.platform.service.AnimalService;
import com.dnproject.platform.service.AnimalSyncService.SyncResult;
import com.dnproject.platform.service.PublicApiService;
import com.dnproject.platform.service.SyncHistoryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AdminAnimalControllerTest {

    @Mock
    private AnimalService animalService;
    @Mock
    private PublicApiService publicApiService;
    @Mock
    private SyncHistoryService syncHistoryService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .standaloneSetup(new AdminAnimalController(animalService, publicApiService, syncHistoryService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
        when(publicApiService.isApiKeyConfigured()).thenReturn(true);
    }

    @Test
    @DisplayName("공공 API 호출이 모두 실패하면 502와 실패 사유를 응답하고 이력에 실패를 남긴다")
    void allFailedReturnsError() throws Exception {
        SyncResult failed = new SyncResult(0, 0, 0, 2, 0, "공공 API 호출 실패 (HTTP 403)");
        when(animalService.syncFromPublicApiWithStatus(anyInt(), any(), any())).thenReturn(failed);

        mockMvc.perform(post("/api/admin/animals/sync-from-public-api").param("days", "3"))
                .andExpect(status().isBadGateway())
                .andExpect(jsonPath("$.error").value("PUBLIC_API_SYNC_FAILED"))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("HTTP 403")));

        verify(syncHistoryService).save(eq(failed), eq(SyncTriggerType.MANUAL), eq(3), eq("ALL"),
                contains("모두 실패"));
    }

    @Test
    @DisplayName("일부만 실패하면 기존 필드를 유지하고 success=false와 errorMessage를 더해 응답한다")
    void partialFailureAddsFailureFields() throws Exception {
        SyncResult partial = new SyncResult(5, 1, 0, 1, 1, "공공 API 호출 실패 (HTTP 500)");
        when(animalService.syncFromPublicApiWithStatus(anyInt(), any(), any())).thenReturn(partial);

        mockMvc.perform(post("/api/admin/animals/sync-from-public-api").param("days", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("동기화 일부 실패"))
                .andExpect(jsonPath("$.data.addedCount").value(5))
                .andExpect(jsonPath("$.data.updatedCount").value(1))
                .andExpect(jsonPath("$.data.syncedCount").value(6))
                .andExpect(jsonPath("$.data.removedCount").value(0))
                .andExpect(jsonPath("$.data.apiKeyConfigured").value(true))
                .andExpect(jsonPath("$.data.success").value(false))
                .andExpect(jsonPath("$.data.failedRequestCount").value(1))
                .andExpect(jsonPath("$.data.errorMessage").value(org.hamcrest.Matchers.containsString("HTTP 500")));

        verify(syncHistoryService).save(eq(partial), eq(SyncTriggerType.MANUAL), eq(3), eq("ALL"),
                contains("1건 실패"));
    }

    @Test
    @DisplayName("실패가 없으면 기존과 같은 성공 응답을 주고 이력의 오류 메시지는 비운다")
    void successKeepsResponse() throws Exception {
        SyncResult ok = new SyncResult(2, 0, 1, 0, 2, null);
        when(animalService.syncFromPublicApiWithStatus(anyInt(), any(), any())).thenReturn(ok);

        mockMvc.perform(post("/api/admin/animals/sync-from-public-api").param("days", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("동기화 완료"))
                .andExpect(jsonPath("$.data.addedCount").value(2))
                .andExpect(jsonPath("$.data.success").value(true))
                .andExpect(jsonPath("$.data.errorMessage").doesNotExist());

        verify(syncHistoryService).save(eq(ok), eq(SyncTriggerType.MANUAL), eq(3), eq("ALL"), isNull());
    }
}
