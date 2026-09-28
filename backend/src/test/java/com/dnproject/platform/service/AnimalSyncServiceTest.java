package com.dnproject.platform.service;

import com.dnproject.platform.domain.Animal;
import com.dnproject.platform.domain.constant.AnimalStatus;
import com.dnproject.platform.dto.publicapi.AnimalItem;
import com.dnproject.platform.exception.PublicApiException;
import com.dnproject.platform.repository.AnimalImageRepository;
import com.dnproject.platform.repository.AnimalRepository;
import com.dnproject.platform.repository.FavoriteRepository;
import com.dnproject.platform.repository.ShelterRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.transaction.PlatformTransactionManager;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AnimalSyncServiceTest {

    @Mock
    private PublicApiService publicApiService;

    @Mock
    private AnimalRepository animalRepository;

    @Mock
    private ShelterRepository shelterRepository;

    @Mock
    private FavoriteRepository favoriteRepository;

    @Mock
    private AnimalImageRepository animalImageRepository;

    @Mock
    private PlatformTransactionManager transactionManager;

    @InjectMocks
    private AnimalSyncService animalSyncService;

    @BeforeEach
    void setUp() {
        // 스프링 컨테이너 밖에서는 @PostConstruct가 호출되지 않으므로 직접 초기화한다.
        animalSyncService.init();
    }

    @Test
    @DisplayName("DB에 있는 동물이 API에서 '종료' 상태로 넘어오면 DB에서 삭제되어야 한다")
    void shouldDeleteExistingAnimalWhenStatusIsTerminated() {
        // given
        String desertionNo = "test-123";
        AnimalItem item = new AnimalItem();
        item.setDesertionNo(desertionNo);
        item.setProcessState("종료(입양)"); // mapStatus에서 null을 반환하게 함

        Animal existingAnimal = Animal.builder()
                .id(1L)
                .publicApiAnimalId(desertionNo)
                .status(AnimalStatus.PROTECTED)
                .build();

        // Mocking: API에서 해당 아이템을 반환하도록 설정
        when(publicApiService.getAbandonedAnimals(any(), any(), anyString(), any(), any(), any(), anyInt(), anyInt()))
                .thenReturn(List.of(item)) // 첫 페이지에 아이템 반환
                .thenReturn(Collections.emptyList()); // 두 번째 호출 시 종료

        // Mocking: DB에 해당 아이템이 이미 존재함을 설정
        when(animalRepository.findByPublicApiAnimalId(desertionNo)).thenReturn(Optional.of(existingAnimal));

        // when
        AnimalSyncService.SyncResult result = animalSyncService.syncFromPublicApi(1, 1, "DOG");

        // then
        assertThat(result.removedCount()).isEqualTo(1);
        verify(animalRepository, times(1)).delete(existingAnimal);
        verify(animalRepository, never()).save(any());
    }

    @Test
    @DisplayName("DB에 없는 동물이 API에서 '종료' 상태로 넘어오면 아무것도 하지 않아야 한다 (Skip)")
    void shouldSkipNewAnimalWhenStatusIsTerminated() {
        // given
        String desertionNo = "new-456";
        AnimalItem item = new AnimalItem();
        item.setDesertionNo(desertionNo);
        item.setProcessState("종료(안락사)");

        // Mocking: API에서 해당 아이템을 반환하도록 설정
        when(publicApiService.getAbandonedAnimals(any(), any(), anyString(), any(), any(), any(), anyInt(), anyInt()))
                .thenReturn(List.of(item))
                .thenReturn(Collections.emptyList());

        // Mocking: DB에 해당 아이템이 없음을 설정
        when(animalRepository.findByPublicApiAnimalId(desertionNo)).thenReturn(Optional.empty());

        // when
        AnimalSyncService.SyncResult result = animalSyncService.syncFromPublicApi(1, 1, "DOG");

        // then
        assertThat(result.removedCount()).isEqualTo(0);
        assertThat(result.addedCount()).isEqualTo(0);
        verify(animalRepository, never()).delete(any());
        verify(animalRepository, never()).save(any());
    }

    @Test
    @DisplayName("공공 API 호출이 모두 실패하면 결과에 전체 실패와 사유가 기록된다")
    void allApiCallsFailedIsReported() {
        when(publicApiService.getAbandonedAnimals(any(), any(), anyString(), any(), any(), any(), anyInt(), anyInt()))
                .thenThrow(new PublicApiException("공공 API 호출 실패 (HTTP 403)"));

        AnimalSyncService.SyncResult result = animalSyncService.syncFromPublicApi(3, null, null);

        assertThat(result.completelyFailed()).isTrue();
        assertThat(result.failedRequestCount()).isEqualTo(2); // 개, 고양이 각 1회
        assertThat(result.errorMessage()).contains("HTTP 403");
        assertThat(result.failureSummary()).contains("모두 실패").contains("HTTP 403");
        assertThat(result.addedCount()).isZero();
    }

    @Test
    @DisplayName("일부 축종만 실패하면 부분 실패로 기록되고 성공한 축종의 결과는 유지된다")
    void partialFailureKeepsSucceededResults() {
        AnimalItem item = new AnimalItem();
        item.setDesertionNo("dog-1");
        item.setProcessState("보호중");
        when(publicApiService.getAbandonedAnimals(any(), any(), eq("417000"), any(), any(), any(), anyInt(), anyInt()))
                .thenReturn(List.of(item));
        when(publicApiService.getAbandonedAnimals(any(), any(), eq("422400"), any(), any(), any(), anyInt(), anyInt()))
                .thenThrow(new PublicApiException("공공 API 호출 실패 (HTTP 500)"));
        when(animalRepository.findByPublicApiAnimalId("dog-1")).thenReturn(Optional.empty());
        when(shelterRepository.findFirstByName(anyString())).thenReturn(Optional.empty());

        AnimalSyncService.SyncResult result = animalSyncService.syncFromPublicApi(3, null, null);

        assertThat(result.addedCount()).isEqualTo(1);
        assertThat(result.hasFailures()).isTrue();
        assertThat(result.completelyFailed()).isFalse();
        assertThat(result.failureSummary()).contains("1건 실패").contains("HTTP 500");
    }

    @Test
    @DisplayName("API 호출이 성공하면 결과 0건이어도 실패가 아니다")
    void emptyResultIsNotFailure() {
        when(publicApiService.getAbandonedAnimals(any(), any(), anyString(), any(), any(), any(), anyInt(), anyInt()))
                .thenReturn(Collections.emptyList());

        AnimalSyncService.SyncResult result = animalSyncService.syncFromPublicApi(3, null, null);

        assertThat(result.hasFailures()).isFalse();
        assertThat(result.failureSummary()).isNull();
    }
}
