package com.dnproject.platform.mapper;

import com.dnproject.platform.domain.Preference;
import com.dnproject.platform.dto.response.PreferenceResponse;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

@Component
public class PreferenceMapper {

    public PreferenceResponse toResponse(Preference p) {
        List<String> rList = null;
        if (p.getRegion() != null && !p.getRegion().isBlank()) {
            rList = Arrays.stream(p.getRegion().split(","))
                    .map(String::trim)
                    .filter(s -> !s.isBlank())
                    .toList();
        }

        return PreferenceResponse.builder()
                .id(p.getId())
                .userId(p.getUser().getId())
                .species(p.getSpecies())
                .minAge(p.getMinAge())
                .maxAge(p.getMaxAge())
                .size(p.getSize())
                .regions(rList)
                .build();
    }
}
