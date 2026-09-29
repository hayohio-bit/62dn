package com.dnproject.platform.util;

import java.time.LocalDate;
import java.time.ZoneId;

/**
 * 공고일·D-day 계산에 쓰는 "오늘"은 한국 날짜로 고정한다.
 * 서버 기본 시간대가 UTC면 한국 시간 00~09시에 날짜가 하루 어긋나, 이미 마감된 공고가 D-Day로 보일 수 있다.
 */
public final class KoreanDate {

    public static final ZoneId ZONE = ZoneId.of("Asia/Seoul");

    private KoreanDate() {
    }

    public static LocalDate today() {
        return LocalDate.now(ZONE);
    }
}
