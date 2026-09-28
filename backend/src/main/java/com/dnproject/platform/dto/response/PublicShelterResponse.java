package com.dnproject.platform.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublicShelterResponse {
    private Long id;
    private String name;
    private String address;
    private String regionSido;
    private String regionSigungu;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private String phone;
    private String email;
}
