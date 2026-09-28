package com.dnproject.platform.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class FindEmailRequest {
    @NotBlank(message = "이름을 입력해 주세요.")
    private String name;

    @NotBlank(message = "전화번호를 입력해 주세요.")
    private String phone;
}
