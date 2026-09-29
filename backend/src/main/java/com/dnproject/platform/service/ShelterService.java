package com.dnproject.platform.service;

import com.dnproject.platform.domain.Shelter;
import com.dnproject.platform.domain.constant.VerificationStatus;
import com.dnproject.platform.dto.response.PublicShelterResponse;
import com.dnproject.platform.dto.response.ShelterResponse;
import com.dnproject.platform.exception.NotFoundException;
import com.dnproject.platform.repository.ShelterRepository;
import com.dnproject.platform.mapper.ShelterMapper;
import com.dnproject.platform.util.AddressRegionParser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j

@Service
@RequiredArgsConstructor
public class ShelterService {

    private final ShelterRepository shelterRepository;
    private final ShelterMapper shelterMapper;

    @Transactional(readOnly = true)
    public ShelterResponse getById(Long shelterId) {
        Shelter shelter = shelterRepository.findById(shelterId)
                .orElseThrow(() -> new NotFoundException("보호소를 찾을 수 없습니다. id=" + shelterId));
        return shelterMapper.toResponse(shelter);
    }

    @Transactional(readOnly = true)
    public PublicShelterResponse getPublicById(Long shelterId) {
        return shelterRepository.findById(shelterId)
                .map(shelterMapper::toPublicResponse)
                .orElseThrow(() -> new NotFoundException("보호소를 찾을 수 없습니다. id=" + shelterId));
    }

    /**
     * regionSido/regionSigungu가 비어 있는 보호소에 대해 주소를 파싱해 채움.
     * 기존 데이터 보정 및 공공API 동기화 시 이름으로만 찾아 생성된 보호소 보정용.
     */
    @Transactional
    public int backfillRegionFromAddress() {
        List<Shelter> all = shelterRepository.findAll();
        int updated = 0;
        for (Shelter s : all) {
            if (s.getRegionSido() != null)
                continue;
            String addr = s.getAddress();
            if (addr == null || addr.isBlank())
                continue;
            String[] region = AddressRegionParser.parse(addr);
            if (region[0] != null || region[1] != null) {
                s.setRegionSido(region[0]);
                s.setRegionSigungu(region[1]);
                shelterRepository.save(s);
                updated++;
            }
        }
        if (updated > 0)
            log.info("Shelter region backfill: {} shelters updated", updated);
        return updated;
    }

    @Transactional(readOnly = true)
    public Page<PublicShelterResponse> searchPublicShelters(String regionSido, String keyword, Pageable pageable) {
        return shelterRepository.searchPublicShelters(regionSido, keyword, pageable)
                .map(shelterMapper::toPublicResponse);
    }

}
