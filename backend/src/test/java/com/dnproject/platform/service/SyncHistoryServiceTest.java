package com.dnproject.platform.service;

import com.dnproject.platform.domain.SyncHistory;
import com.dnproject.platform.domain.constant.SyncTriggerType;
import com.dnproject.platform.repository.SyncHistoryRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;

@ExtendWith(MockitoExtension.class)
class SyncHistoryServiceTest {

    @Mock
    private SyncHistoryRepository syncHistoryRepository;

    @InjectMocks
    private SyncHistoryService syncHistoryService;

    @Test
    @DisplayName("동기화로 삭제한 동물 수는 이력의 삭제 건수로 기록된다")
    void removedCountIsRecordedAsDeletedCount() {
        given(syncHistoryRepository.save(any(SyncHistory.class))).willAnswer(inv -> inv.getArgument(0));

        SyncHistory saved = syncHistoryService.save(new AnimalSyncService.SyncResult(3, 2, 5),
                SyncTriggerType.MANUAL, 7, "ALL", null);

        assertThat(saved.getAddedCount()).isEqualTo(3);
        assertThat(saved.getUpdatedCount()).isEqualTo(2);
        assertThat(saved.getDeletedCount()).isEqualTo(5);
        assertThat(saved.getCorrectedCount()).isZero();
    }
}
