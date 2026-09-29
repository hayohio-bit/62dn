package com.dnproject.platform.mapper;

import com.dnproject.platform.domain.Animal;
import com.dnproject.platform.domain.Shelter;
import com.dnproject.platform.dto.response.AnimalResponse;
import com.dnproject.platform.dto.response.PageResponse;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Component;

import com.dnproject.platform.util.ContactPhone;
import com.dnproject.platform.util.KoreanDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Component
public class AnimalMapper {

        public AnimalResponse toResponse(Animal a) {
                Shelter shelter = a.getShelter();
                String shelterName = shelter != null ? shelter.getName() : null;
                String shelterAddress = shelter != null ? shelter.getAddress() : null;
                String shelterPhone = shelter != null ? ContactPhone.usable(shelter.getPhone()) : null;
                Double shelterLat = shelter != null && shelter.getLatitude() != null
                                ? shelter.getLatitude().doubleValue()
                                : null;
                Double shelterLng = shelter != null && shelter.getLongitude() != null
                                ? shelter.getLongitude().doubleValue()
                                : null;

                Integer daysUntilExpiry = null;
                if (a.getNoticeEndDate() != null) {
                        long days = ChronoUnit.DAYS.between(KoreanDate.today(), a.getNoticeEndDate());
                        daysUntilExpiry = (int) days;
                }

                return AnimalResponse.builder()
                                .id(a.getId())
                                .publicApiAnimalId(a.getPublicApiAnimalId())
                                .orgName(a.getOrgName())
                                .chargeName(a.getChargeName())
                                .chargePhone(ContactPhone.usable(a.getChargePhone()))
                                .shelterId(shelter != null ? shelter.getId() : null)
                                .shelterName(shelterName)
                                .shelterAddress(shelterAddress)
                                .shelterPhone(shelterPhone)
                                .shelterLatitude(shelterLat)
                                .shelterLongitude(shelterLng)
                                .species(a.getSpecies())
                                .breed(a.getBreed())
                                .name(displayName(a.getName()))
                                .age(a.getAge())
                                .gender(a.getGender())
                                .size(a.getSize())
                                .weight(a.getWeight() != null ? a.getWeight().doubleValue() : null)
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

        /** 예전 동기화가 붙인 "(가명)" 표기를 뗀다. 임시 이름 여부는 유기번호(publicApiAnimalId)로 화면에서 판단한다. */
        static String displayName(String name) {
                if (name == null) {
                        return null;
                }
                return name.endsWith("(가명)") ? name.substring(0, name.length() - "(가명)".length()) : name;
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
