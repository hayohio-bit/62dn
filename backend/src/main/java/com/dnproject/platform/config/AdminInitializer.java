package com.dnproject.platform.config;

import com.dnproject.platform.domain.User;
import com.dnproject.platform.domain.constant.Role;
import com.dnproject.platform.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Slf4j
@Component
@Order(1)
@RequiredArgsConstructor
public class AdminInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        Optional<User> admin = userRepository.findByEmailTrimmed("admin@admin.com");
        if (admin.isEmpty()) {
            User newAdmin = User.builder()
                    .email("admin@admin.com")
                    .name("시스템 관리자")
                    .password(passwordEncoder.encode("1234"))
                    .phone("010-0000-0000")
                    .role(Role.SUPER_ADMIN)
                    .build();
            userRepository.save(newAdmin);
            log.info("Default super admin created: admin@admin.com");
        } else {
            log.info("Super admin already exists: admin@admin.com (비밀번호 유지)");
        }
    }
}
