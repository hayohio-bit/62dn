package com.dnproject.platform.config;

import com.dnproject.platform.domain.User;
import com.dnproject.platform.domain.constant.Role;
import com.dnproject.platform.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * 최초 관리자(SUPER_ADMIN) 계정 생성.
 * app.admin.bootstrap-email / bootstrap-password 가 모두 설정되어 있고 해당 이메일의 회원이 없을 때만 한 번 만든다.
 * local/dev 프로필은 yml에 기본값이 있고, 운영은 ADMIN_BOOTSTRAP_EMAIL / ADMIN_BOOTSTRAP_PASSWORD 환경 변수로 지정한다.
 */
@Slf4j
@Component
@Order(1)
public class AdminInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final String bootstrapEmail;
    private final String bootstrapPassword;

    public AdminInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder,
            @Value("${app.admin.bootstrap-email:}") String bootstrapEmail,
            @Value("${app.admin.bootstrap-password:}") String bootstrapPassword) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.bootstrapEmail = bootstrapEmail == null ? "" : bootstrapEmail.trim();
        this.bootstrapPassword = bootstrapPassword == null ? "" : bootstrapPassword;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (bootstrapEmail.isEmpty() || bootstrapPassword.isEmpty()) {
            log.info("최초 관리자 설정(app.admin.bootstrap-*)이 없어 관리자 계정 생성을 건너뜁니다.");
            return;
        }
        if (userRepository.findByEmailTrimmed(bootstrapEmail).isPresent()) {
            log.info("최초 관리자 계정이 이미 있습니다: {} (비밀번호 유지)", bootstrapEmail);
            return;
        }
        userRepository.save(User.builder()
                .email(bootstrapEmail)
                .name("시스템 관리자")
                .password(passwordEncoder.encode(bootstrapPassword))
                .role(Role.SUPER_ADMIN)
                .build());
        log.info("최초 관리자 계정 생성: {}", bootstrapEmail);
    }
}
