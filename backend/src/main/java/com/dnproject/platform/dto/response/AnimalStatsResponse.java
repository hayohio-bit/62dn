package com.dnproject.platform.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** 랜딩 실시간 현황: 지금 공고 중인 동물 수, 일주일 안에 공고가 끝나는 동물 수, 공고 중인 동물이 있는 보호소 수 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnimalStatsResponse {
    private long protectedCount;
    private long endingWithinWeekCount;
    private long shelterCount;
}
