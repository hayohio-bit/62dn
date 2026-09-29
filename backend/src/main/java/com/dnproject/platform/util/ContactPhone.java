package com.dnproject.platform.util;

/**
 * 화면에 전화 링크로 내보낼 수 있는 번호인지 판단한다.
 * 예전 동기화는 번호가 없는 보호소에 "000-0000-0000"을 저장했으므로, 숫자가 모두 0인 번호도 없는 것으로 본다.
 */
public final class ContactPhone {

    private ContactPhone() {
    }

    /** 쓸 수 있는 번호면 앞뒤 공백을 지워 돌려주고, 아니면 null */
    public static String usable(String phone) {
        if (phone == null || phone.isBlank()) {
            return null;
        }
        String digits = phone.replaceAll("[^0-9]", "");
        if (digits.isEmpty() || digits.chars().allMatch(c -> c == '0')) {
            return null;
        }
        return phone.trim();
    }
}
