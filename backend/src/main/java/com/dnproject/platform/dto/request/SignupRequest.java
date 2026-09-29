package com.dnproject.platform.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SignupRequest {

    @NotBlank(message = "이메일은 필수입니다")
    @Email
    private String email;

    @NotBlank(message = "비밀번호는 필수입니다")
    @Size(min = 8)
    private String password;

    @NotBlank(message = "이름은 필수입니다")
    @Size(max = 50)
    private String name;

    @Size(max = 20)
    private String phone;

    // 주소는 쓰는 곳이 없어 받지 않는다. 예전 클라이언트가 address를 보내도 Jackson이 알 수 없는 필드로 무시한다.
}
