package com.dnproject.platform.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.ExchangeFunction;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(OutputCaptureExtension.class)
class PublicApiServiceTest {

    /** 실제 키가 아닌 테스트용 값. '/'와 '='를 넣어 URL 인코딩 형태도 확인한다. */
    private static final String KEY = "TEST/KEY+abc123==";
    private static final String ENCODED_KEY = "TEST%2FKEY%2Babc123%3D%3D";

    private PublicApiService service;

    private PublicApiService createService(ExchangeFunction exchange) {
        PublicApiService s = new PublicApiService(WebClient.builder().exchangeFunction(exchange), new ObjectMapper());
        ReflectionTestUtils.setField(s, "serviceKey", KEY);
        ReflectionTestUtils.setField(s, "apiBaseUrl", "https://apis.example.test/1543061");
        return s;
    }

    @BeforeEach
    void setUp() {
        service = createService(request -> Mono.error(new IllegalStateException("사용하지 않음")));
    }

    @Test
    @DisplayName("maskServiceKey는 키 원문, URL 인코딩된 키, 알 수 없는 serviceKey 파라미터 값을 모두 가린다")
    void maskServiceKeyHidesKeyInAllForms() {
        assertThat(service.maskServiceKey("key=" + KEY)).doesNotContain(KEY);
        assertThat(service.maskServiceKey("GET https://x/y?serviceKey=" + ENCODED_KEY + "&pageNo=1"))
                .doesNotContain(ENCODED_KEY)
                .contains("serviceKey=****&pageNo=1");
        assertThat(service.maskServiceKey("GET https://x/y?pageNo=1&ServiceKey=otherKey123"))
                .isEqualTo("GET https://x/y?pageNo=1&ServiceKey=****");
        assertThat(service.maskServiceKey(null)).isNull();
    }

    @Test
    @DisplayName("공공 API가 403을 반환해도 로그에 serviceKey가 남지 않는다")
    void forbiddenResponseDoesNotLogServiceKey(CapturedOutput output) {
        PublicApiService s = createService(request -> Mono.just(
                ClientResponse.create(HttpStatus.FORBIDDEN).body("Forbidden").build()));

        s.getAbandonedAnimals(null, null, "417000", null, LocalDate.now().minusDays(1), LocalDate.now(), 1, 100);

        assertThat(output.getAll())
                .contains("HTTP 403")
                .doesNotContain(KEY)
                .doesNotContain(ENCODED_KEY);
    }

    @Test
    @DisplayName("기동 시 키 설정 로그에 키 문자열이 포함되지 않는다")
    void startupLogDoesNotContainKeyPrefix(CapturedOutput output) {
        service.logApiKeyStatus();

        assertThat(output.getAll())
                .contains("공공 API 키 설정됨")
                .doesNotContain(KEY.substring(0, 8));
    }
}
