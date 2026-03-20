package com.tccs.config;

import com.tccs.model.User;
import com.tccs.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Fixes user password hashes after seed.sql inserts placeholder hashes.
 * Only runs if passwords need to be reset (checks if stored hash is not a valid BCrypt hash).
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(ApplicationArguments args) {
        fixPasswordIfNeeded("operator1", "password123");
        fixPasswordIfNeeded("manager1", "password123");
        fixPasswordIfNeeded("admin1", "admin123");
        log.info("TCCS Data initialization complete.");
        log.info("Login: operator1/password123, manager1/password123, admin1/admin123");
    }

    private void fixPasswordIfNeeded(String username, String password) {
        userRepository.findByUsernameAndIsActiveTrue(username).ifPresent(user -> {
            String hash = user.getPasswordHash();
            // If not a valid BCrypt hash (our seed.sql has placeholder), re-hash
            if (hash == null || !hash.startsWith("$2a$") || !isValidBcrypt(hash, password)) {
                user.setPasswordHash(passwordEncoder.encode(password));
                userRepository.save(user);
                log.info("Fixed password hash for user: {}", username);
            }
        });
    }

    private boolean isValidBcrypt(String hash, String password) {
        try {
            return passwordEncoder.matches(password, hash);
        } catch (Exception e) {
            return false;
        }
    }
}
