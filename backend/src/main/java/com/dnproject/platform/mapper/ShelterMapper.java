package com.dnproject.platform.mapper;

import com.dnproject.platform.domain.Shelter;
import com.dnproject.platform.dto.response.PublicShelterResponse;
import com.dnproject.platform.dto.response.ShelterResponse;
import org.springframework.stereotype.Component;

@Component
public class ShelterMapper {

    public ShelterResponse toResponse(Shelter s) {
        return ShelterResponse.builder()
                .id(s.getId())
                .name(s.getName())
                .address(s.getAddress())
                .phone(s.getPhone())
                .email(s.getEmail())
                .businessRegistrationNumber(s.getBusinessRegistrationNumber())
                .businessRegistrationFile(s.getBusinessRegistrationFile())
                .verificationStatus(s.getVerificationStatus())
                .createdAt(s.getCreatedAt())
                .build();
    }

    public PublicShelterResponse toPublicResponse(Shelter s) {
        return PublicShelterResponse.builder()
                .id(s.getId())
                .name(s.getName())
                .address(s.getAddress())
                .regionSido(s.getRegionSido())
                .regionSigungu(s.getRegionSigungu())
                .latitude(s.getLatitude())
                .longitude(s.getLongitude())
                .phone(s.getPhone())
                .email(s.getEmail())
                .build();
    }
}
