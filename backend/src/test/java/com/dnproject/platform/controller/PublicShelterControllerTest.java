package com.dnproject.platform.controller;

import com.dnproject.platform.dto.response.PublicShelterResponse;
import com.dnproject.platform.exception.GlobalExceptionHandler;
import com.dnproject.platform.exception.NotFoundException;
import com.dnproject.platform.service.ShelterService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class PublicShelterControllerTest {

    @Mock
    private ShelterService shelterService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .standaloneSetup(new PublicShelterController(shelterService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    @DisplayName("보호소 상세는 공개 정보를 응답한다")
    void getPublicShelter() throws Exception {
        when(shelterService.getPublicById(3L)).thenReturn(PublicShelterResponse.builder()
                .id(3L).name("서울 강동 동물보호센터").address("서울특별시 강동구").phone("02-000-0003").build());

        mockMvc.perform(get("/api/shelters/3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("서울 강동 동물보호센터"))
                .andExpect(jsonPath("$.data.phone").value("02-000-0003"));
    }

    @Test
    @DisplayName("없는 보호소는 404를 응답한다")
    void missingShelterReturns404() throws Exception {
        when(shelterService.getPublicById(99L)).thenThrow(new NotFoundException("보호소를 찾을 수 없습니다. id=99"));

        mockMvc.perform(get("/api/shelters/99")).andExpect(status().isNotFound());
    }
}
