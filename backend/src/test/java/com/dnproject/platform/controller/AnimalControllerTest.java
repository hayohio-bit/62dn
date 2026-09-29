package com.dnproject.platform.controller;

import com.dnproject.platform.domain.constant.Gender;
import com.dnproject.platform.dto.response.AnimalResponse;
import com.dnproject.platform.dto.response.PageResponse;
import com.dnproject.platform.exception.GlobalExceptionHandler;
import com.dnproject.platform.service.AnimalService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AnimalControllerTest {

    @Mock
    private AnimalService animalService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .standaloneSetup(new AnimalController(animalService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    private Sort requestSort(String sort) throws Exception {
        when(animalService.findAll(any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(PageResponse.<AnimalResponse>builder().content(List.of()).build());
        var request = get("/api/animals");
        if (sort != null) {
            request = request.param("sort", sort);
        }
        mockMvc.perform(request).andExpect(status().isOk());
        ArgumentCaptor<Pageable> pageable = ArgumentCaptor.forClass(Pageable.class);
        verify(animalService).findAll(any(), any(), any(), any(), any(), any(), any(), pageable.capture());
        return pageable.getValue().getSort();
    }

    @Test
    @DisplayName("정렬을 지정하지 않으면 공고 마감 임박순으로 조회한다")
    void defaultSortIsNoticeEndDateAsc() throws Exception {
        Sort sort = requestSort(null);

        Sort.Order order = sort.getOrderFor("noticeEndDate");
        assertThat(order).isNotNull();
        assertThat(order.getDirection()).isEqualTo(Sort.Direction.ASC);
        assertThat(order.getNullHandling()).isEqualTo(Sort.NullHandling.NULLS_LAST);
    }

    @Test
    @DisplayName("새로 들어온 순은 공고 시작일 내림차순으로 조회한다")
    void noticeStartDateDesc() throws Exception {
        Sort sort = requestSort("noticeStartDate,desc");

        assertThat(sort.getOrderFor("noticeStartDate").getDirection()).isEqualTo(Sort.Direction.DESC);
        assertThat(sort.getOrderFor("id")).isNotNull();
    }

    @Test
    @DisplayName("허용하지 않은 정렬 필드는 기본 정렬로 바꾼다")
    void unknownSortFieldFallsBackToDefault() throws Exception {
        Sort sort = requestSort("shelter.phone,desc");

        assertThat(sort.getOrderFor("shelter.phone")).isNull();
        assertThat(sort.getOrderFor("noticeEndDate").getDirection()).isEqualTo(Sort.Direction.ASC);
    }

    @Test
    @DisplayName("성별 조건을 서비스에 전달한다")
    void passesGender() throws Exception {
        when(animalService.findAll(any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(PageResponse.<AnimalResponse>builder().content(List.of()).build());

        mockMvc.perform(get("/api/animals").param("gender", "FEMALE")).andExpect(status().isOk());

        verify(animalService).findAll(isNull(), isNull(), isNull(), eq(Gender.FEMALE), isNull(), isNull(),
                isNull(), any());
    }
}
