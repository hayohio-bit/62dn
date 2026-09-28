package com.dnproject.platform.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.web.reactive.function.client.ExchangeStrategies;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.Set;
import java.util.TreeSet;

/**
 * 실제 공공 API 응답의 processState 값을 수집하는 수동 점검용 테스트.
 * 외부 API를 호출하므로 일반 빌드에서는 실행하지 않는다.
 * 실행하려면 PUBLIC_API_INSPECTION_KEY 환경 변수에 서비스 키를 넣고 이 테스트만 실행한다.
 */
@Tag("external")
@EnabledIfEnvironmentVariable(named = "PUBLIC_API_INSPECTION_KEY", matches = ".+")
class PublicApiInspectionTest {

    private static final String BASE_URL = "https://apis.data.go.kr/1543061/abandonmentPublicService_v2/abandonmentPublic_v2";

    @Test
    void analyzeProcessStates() throws Exception {
        String serviceKey = System.getenv("PUBLIC_API_INSPECTION_KEY");
        String uri = UriComponentsBuilder.fromHttpUrl(BASE_URL)
                .queryParam("serviceKey", serviceKey)
                .queryParam("pageNo", 1)
                .queryParam("numOfRows", 1000)
                .queryParam("_type", "json")
                .build()
                .toUriString();

        final int size = 10 * 1024 * 1024;
        ExchangeStrategies strategies = ExchangeStrategies.builder()
                .codecs(codecs -> codecs.defaultCodecs().maxInMemorySize(size))
                .build();
        WebClient webClient = WebClient.builder().exchangeStrategies(strategies).build();

        String json = webClient.get().uri(uri).retrieve().bodyToMono(String.class).block();
        JsonNode items = new ObjectMapper().readTree(json)
                .path("response").path("body").path("items").path("item");

        Set<String> states = new TreeSet<>();
        if (items.isArray()) {
            for (JsonNode item : items) {
                if (item.has("processState")) {
                    states.add(item.get("processState").asText());
                }
            }
        } else if (items.isObject() && items.has("processState")) {
            states.add(items.get("processState").asText());
        }
        System.out.println("processState 값: " + states);
    }
}
