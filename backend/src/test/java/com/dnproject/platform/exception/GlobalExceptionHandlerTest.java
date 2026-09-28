package com.dnproject.platform.exception;

import com.dnproject.platform.domain.Animal;
import com.dnproject.platform.domain.constant.Species;
import org.hibernate.query.sqm.PathElementException;
import org.hibernate.query.sqm.UnknownPathException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.dao.InvalidDataAccessApiUsageException;
import org.springframework.data.mapping.PropertyReferenceException;
import org.springframework.data.util.TypeInformation;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class GlobalExceptionHandlerTest {

    @RestController
    static class TestController {
        @GetMapping("/t/enum")
        String byEnum(@RequestParam Species species) {
            return species.name();
        }

        @PostMapping("/t/body")
        String body(@RequestBody Map<String, String> body) {
            return "ok";
        }

        @GetMapping("/t/sort")
        String sort() {
            throw new InvalidDataAccessApiUsageException("bad sort",
                    new PropertyReferenceException("foo", TypeInformation.of(Animal.class), List.of()));
        }

        /** 실제 @Query + Sort에서 잘못된 속성을 넣었을 때 Hibernate 6.4가 만드는 예외 사슬 */
        @GetMapping("/t/sort-hibernate")
        String sortHibernate() {
            throw new InvalidDataAccessApiUsageException("bad sort",
                    new IllegalArgumentException(new UnknownPathException("Could not resolve attribute 'foo'",
                            "SELECT a FROM Animal a", new PathElementException("Could not resolve attribute 'foo'"))));
        }

        @GetMapping("/t/other-usage")
        String otherUsage() {
            throw new InvalidDataAccessApiUsageException("internal detail");
        }
    }

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(new TestController())
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    @DisplayName("잘못된 enum 파라미터는 500이 아니라 400으로 응답한다")
    void typeMismatchIs400() throws Exception {
        mockMvc.perform(get("/t/enum").param("species", "FOO"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("INVALID_PARAMETER"));
    }

    @Test
    @DisplayName("해석할 수 없는 JSON 본문은 400으로 응답한다")
    void unreadableBodyIs400() throws Exception {
        mockMvc.perform(post("/t/body").contentType(MediaType.APPLICATION_JSON).content("{bad"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("INVALID_BODY"));
    }

    @Test
    @DisplayName("지원하지 않는 HTTP 메서드는 405로 응답한다")
    void methodNotSupportedIs405() throws Exception {
        mockMvc.perform(patch("/t/enum"))
                .andExpect(status().isMethodNotAllowed())
                .andExpect(jsonPath("$.status").value(405));
    }

    @Test
    @DisplayName("존재하지 않는 정렬 속성은 400으로 응답한다")
    void invalidSortIs400() throws Exception {
        mockMvc.perform(get("/t/sort"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("INVALID_SORT"));
        mockMvc.perform(get("/t/sort-hibernate"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("INVALID_SORT"));
    }

    @Test
    @DisplayName("정렬과 무관한 데이터 접근 오용은 내부 메시지 없이 500으로 응답한다")
    void otherInvalidUsageIs500() throws Exception {
        mockMvc.perform(get("/t/other-usage"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.message").value("서버 오류가 발생했습니다."));
    }
}
