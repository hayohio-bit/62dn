package com.dnproject.platform.mapper;

import com.dnproject.platform.domain.Animal;
import com.dnproject.platform.domain.Shelter;
import com.dnproject.platform.dto.response.AnimalResponse;
import com.dnproject.platform.dto.response.PageResponse;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Component
public class AnimalMapper {

        public AnimalResponse toResponse(Animal a) {
                Shelter shelter = a.getShelter();
                String shelterName = shelter != null ? shelter.getName() : null;
                String shelterAddress = shelter != null ? shelter.getAddress() : null;
                String shelterPhone = shelter != null ? shelter.getPhone() : null;
                Double shelterLat = shelter != null && shelter.getLatitude() != null
                                ? shelter.getLatitude().doubleValue()
                                : null;
                Double shelterLng = shelter != null && shelter.getLongitude() != null
                                ? shelter.getLongitude().doubleValue()
                                : null;

                Integer daysUntilExpiry = null;
                if (a.getNoticeEndDate() != null) {
                        long days = ChronoUnit.DAYS.between(LocalDate.now(), a.getNoticeEndDate());
                        daysUntilExpiry = (int) days;
                }

                return AnimalResponse.builder()
                                .id(a.getId())
                                .publicApiAnimalId(a.getPublicApiAnimalId())
                                .orgName(a.getOrgName())
                                .chargeName(a.getChargeName())
                                .chargePhone(a.getChargePhone())
                                .shelterId(shelter != null ? shelter.getId() : null)
                                .shelterName(shelterName)
                                .shelterAddress(shelterAddress)
                                .shelterPhone(shelterPhone)
                                .shelterLatitude(shelterLat)
                                .shelterLongitude(shelterLng)
                                .species(a.getSpecies())
                                .breed(a.getBreed())
                                .name(a.getName())
                                .age(a.getAge())
                                .gender(a.getGender())
                                .size(a.getSize())
                                .description(a.getDescription())
                                .imageUrl(a.getImageUrl())
                                .neutered(a.getNeutered())
                                .status(a.getStatus())
                                .noticeStartDate(a.getNoticeStartDate())
                                .noticeEndDate(a.getNoticeEndDate())
                                .daysUntilExpiry(daysUntilExpiry)
                                .createdAt(a.getCreatedAt())
                                .build();
        }

        public PageResponse<AnimalResponse> toPageResponse(Page<Animal> page) {
                return PageResponse.<AnimalResponse>builder()
                                .content(page.getContent().stream().map(this::toResponse).toList())
                                .page(page.getNumber())
                                .size(page.getSize())
                                .totalElements(page.getTotalElements())
                                .totalPages(page.getTotalPages())
                                .first(page.isFirst())
                                .last(page.isLast())
                                .build();
        }
}
