package com.dnproject.platform.util;

import com.dnproject.platform.domain.constant.Size;

import java.math.BigDecimal;

/**
 * 공공데이터 공고에는 크기가 없어서 체중으로 추정한다. 5kg 미만 소형, 15kg 미만 중형, 그 이상 대형.
 * 화면에는 "(추정)"을 붙여 보여 준다.
 */
public final class SizeEstimate {

    private SizeEstimate() {
    }

    /** 체중을 모르면(null, 0 이하) 크기도 모름(null)으로 둔다 */
    public static Size fromWeight(BigDecimal weightKg) {
        if (weightKg == null || weightKg.signum() <= 0) {
            return null;
        }
        double kg = weightKg.doubleValue();
        if (kg < 5) {
            return Size.SMALL;
        }
        if (kg < 15) {
            return Size.MEDIUM;
        }
        return Size.LARGE;
    }
}
