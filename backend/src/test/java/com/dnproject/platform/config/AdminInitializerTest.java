package com.dnproject.platform.config;

import com.dnproject.platform.domain.User;
import com.dnproject.platform.domain.constant.Role;
import com.dnproject.platform.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

@ExtendWith(MockitoExtension.class)
class AdminInitializerTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Test
    @DisplayName("관리자 설정이 없으면 계정을 만들지 않는다")
    void skipsWhenNotConfigured() {
        new AdminInitializer(userRepository, passwordEncoder, "", "").run();

        verifyNoInteractions(userRepository);
    }

    @Test
    @DisplayName("설정된 이메일의 회원이 없으면 SUPER_ADMIN 계정을 만든다")
    void createsAdminWhenConfiguredAndAbsent() {
        given(userRepository.findByEmailTrimmed("ops@example.com")).willReturn(Optional.empty());
        given(passwordEncoder.encode("s3cret-pass")).willReturn("encoded");

        new AdminInitializer(userRepository, passwordEncoder, " ops@example.com ", "s3cret-pass").run();

        ArgumentCaptor<User> saved = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(saved.capture());
        assertThat(saved.getValue().getEmail()).isEqualTo("ops@example.com");
        assertThat(saved.getValue().getPassword()).isEqualTo("encoded");
        assertThat(saved.getValue().getRole()).isEqualTo(Role.SUPER_ADMIN);
    }

    @Test
    @DisplayName("이미 있는 계정은 비밀번호를 바꾸지 않는다")
    void keepsExistingAccount() {
        given(userRepository.findByEmailTrimmed("ops@example.com")).willReturn(Optional.of(new User()));

        new AdminInitializer(userRepository, passwordEncoder, "ops@example.com", "s3cret-pass").run();

        verify(userRepository, never()).save(any());
    }
}
