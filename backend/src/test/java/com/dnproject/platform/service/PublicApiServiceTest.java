package com.dnproject.platform.service;

import com.dnproject.platform.exception.PublicApiException;
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
import static org.assertj.core.api.Assertions.assertThatThrownBy;

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
    @DisplayName("공공 API가 403을 반환하면 실패 예외를 던지고, 예외 메시지와 로그에 serviceKey가 남지 않는다")
    void forbiddenResponseThrowsWithoutLeakingServiceKey(CapturedOutput output) {
        PublicApiService s = createService(request -> Mono.just(
                ClientResponse.create(HttpStatus.FORBIDDEN).body("Forbidden").build()));

        assertThatThrownBy(() -> s.getAbandonedAnimals(null, null, "417000", null,
                LocalDate.now().minusDays(1), LocalDate.now(), 1, 100))
                .isInstanceOf(PublicApiException.class)
                .hasMessageContaining("HTTP 403")
                .hasMessageNotContaining(KEY)
                .hasMessageNotContaining(ENCODED_KEY)
                .hasNoCause();

        assertThat(output.getAll())
                .contains("HTTP 403")
                .doesNotContain(KEY)
                .doesNotContain(ENCODED_KEY);
    }

    @Test
    @DisplayName("정상 응답에 결과가 0건이면 빈 목록을 반환한다")
    void emptyResultIsNotFailure() {
        String json = "{\"response\":{\"header\":{\"resultCode\":\"00\",\"resultMsg\":\"NORMAL SERVICE.\"},"
                + "\"body\":{\"items\":\"\",\"numOfRows\":100,\"pageNo\":1,\"totalCount\":0}}}";

        assertThat(service.parseAnimalItems(json)).isEmpty();
    }

    @Test
    @DisplayName("정상 응답의 item 배열을 AnimalItem 목록으로 바꾼다")
    void parsesItems() {
        String json = "{\"response\":{\"header\":{\"resultCode\":\"00\"},\"body\":{\"items\":{\"item\":["
                + "{\"desertionNo\":\"1\",\"processState\":\"보호중\"},{\"desertionNo\":\"2\",\"processState\":\"종료(입양)\"}]}}}}";

        assertThat(service.parseAnimalItems(json))
                .extracting("desertionNo")
                .containsExactly("1", "2");
    }

    @Test
    @DisplayName("인증 오류 XML 응답은 사유 코드를 담은 실패 예외로 바꾼다")
    void xmlAuthErrorIsFailure() {
        String xml = "<OpenAPI_ServiceResponse><cmmMsgHeader><errMsg>SERVICE ERROR</errMsg>"
                + "<returnAuthMsg>SERVICE_KEY_IS_NOT_REGISTERED_ERROR</returnAuthMsg>"
                + "<returnReasonCode>30</returnReasonCode></cmmMsgHeader></OpenAPI_ServiceResponse>";

        assertThatThrownBy(() -> service.parseAnimalItems(xml))
                .isInstanceOf(PublicApiException.class)
                .hasMessageContaining("SERVICE_KEY_IS_NOT_REGISTERED_ERROR");
    }

    @Test
    @DisplayName("body 없이 오류 resultCode가 오면 실패 예외를 던진다")
    void errorResultCodeIsFailure() {
        String json = "{\"response\":{\"header\":{\"resultCode\":\"22\",\"resultMsg\":\"LIMITED NUMBER OF SERVICE REQUESTS EXCEEDS ERROR.\"}}}";

        assertThatThrownBy(() -> service.parseAnimalItems(json))
                .isInstanceOf(PublicApiException.class)
                .hasMessageContaining("resultCode=22");
    }

    @Test
    @DisplayName("서비스 키가 없으면 API를 호출하지 않고 빈 목록을 반환한다")
    void missingKeyReturnsEmptyWithoutCalling() {
        PublicApiService s = createService(request -> Mono.error(new AssertionError("호출되면 안 됨")));
        ReflectionTestUtils.setField(s, "serviceKey", "");

        assertThat(s.getAbandonedAnimals(null, null, "417000", null, null, null, 1, 100)).isEmpty();
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
