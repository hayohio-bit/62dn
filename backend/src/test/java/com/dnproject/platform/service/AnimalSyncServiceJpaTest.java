package com.dnproject.platform.service;

import com.dnproject.platform.domain.Animal;
import com.dnproject.platform.domain.AnimalImage;
import com.dnproject.platform.domain.Favorite;
import com.dnproject.platform.domain.Shelter;
import com.dnproject.platform.domain.User;
import com.dnproject.platform.domain.constant.AnimalStatus;
import com.dnproject.platform.domain.constant.Species;
import com.dnproject.platform.dto.publicapi.AnimalItem;
import com.dnproject.platform.repository.AnimalImageRepository;
import com.dnproject.platform.repository.AnimalRepository;
import com.dnproject.platform.repository.FavoriteRepository;
import com.dnproject.platform.repository.ShelterRepository;
import com.dnproject.platform.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * 실제 JPA 스키마(H2, Hibernate 생성)에서 동기화 삭제가 외래 키에 막히지 않는지 확인한다.
 * 동기화는 REQUIRES_NEW 트랜잭션으로 동작하므로 테스트 트랜잭션을 쓰지 않고 직접 정리한다.
 */
@DataJpaTest
@ActiveProfiles("local")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Transactional(propagation = Propagation.NOT_SUPPORTED)
class AnimalSyncServiceJpaTest {

    @Autowired
    private AnimalRepository animalRepository;
    @Autowired
    private ShelterRepository shelterRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private FavoriteRepository favoriteRepository;
    @Autowired
    private AnimalImageRepository animalImageRepository;
    @Autowired
    private PlatformTransactionManager transactionManager;

    @AfterEach
    void cleanUp() {
        favoriteRepository.deleteAll();
        animalImageRepository.deleteAll();
        animalRepository.deleteAll();
        shelterRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    @DisplayName("찜과 이미지가 연결된 동물도 API에서 보호 종료로 넘어오면 DB에서 삭제된다")
    void removesAnimalReferencedByFavoriteAndImage() {
        Shelter shelter = shelterRepository.save(Shelter.builder()
                .name("테스트 보호소").address("서울특별시 중구").phone("02-000-0000").build());
        Animal animal = animalRepository.save(Animal.builder()
                .shelter(shelter).publicApiAnimalId("A-1").species(Species.DOG)
                .status(AnimalStatus.PROTECTED).build());
        User user = userRepository.save(User.builder()
                .email("user@example.test").password("x").name("사용자").build());
        favoriteRepository.save(Favorite.builder().user(user).animal(animal).build());
        animalImageRepository.save(AnimalImage.builder().animal(animal).imageUrl("https://img.example.test/1.jpg").build());

        AnimalItem terminated = new AnimalItem();
        terminated.setDesertionNo("A-1");
        terminated.setProcessState("종료(입양)");
        PublicApiService publicApiService = mock(PublicApiService.class);
        when(publicApiService.getKindList(anyString())).thenReturn(Collections.emptyList());
        when(publicApiService.getAbandonedAnimals(any(), any(), eq("417000"), any(), any(), any(), anyInt(), anyInt()))
                .thenReturn(List.of(terminated));

        AnimalSyncService service = new AnimalSyncService(publicApiService, animalRepository, shelterRepository,
                favoriteRepository, animalImageRepository, transactionManager);
        service.init();

        AnimalSyncService.SyncResult result = service.syncFromPublicApi(3, null, "DOG");

        assertThat(result.removedCount()).isEqualTo(1);
        assertThat(animalRepository.findByPublicApiAnimalId("A-1")).isEmpty();
        assertThat(favoriteRepository.count()).isZero();
        assertThat(animalImageRepository.count()).isZero();
    }
}
