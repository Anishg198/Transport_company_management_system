package com.tccs.controller;

import com.tccs.dto.LoginRequest;
import com.tccs.model.User;
import com.tccs.repository.UserRepository;
import com.tccs.security.JwtUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest req) {
        Optional<User> found = userRepository.findByUsername(req.getUsername());
        if (found.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid credentials"));
        }
        User user = found.get();

        if (!passwordEncoder.matches(req.getPassword(), user.getPasswordHash())) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid credentials"));
        }

        // Check approval status
        if ("PENDING".equals(user.getApprovalStatus())) {
            return ResponseEntity.status(403).body(Map.of("error",
                    "Your account is pending admin approval. You will be notified once approved."));
        }
        if ("REJECTED".equals(user.getApprovalStatus())) {
            return ResponseEntity.status(403).body(Map.of("error",
                    "Your registration request was rejected. Please contact the administrator."));
        }
        if (!Boolean.TRUE.equals(user.getIsActive())) {
            return ResponseEntity.status(403).body(Map.of("error", "Your account has been deactivated."));
        }

        user.setLastLogin(OffsetDateTime.now());
        userRepository.save(user);

        String token = jwtUtil.generateToken(user.getUserId(), user.getUsername(), user.getRole().name());

        Map<String, Object> userMap = new LinkedHashMap<>();
        userMap.put("userId", user.getUserId());
        userMap.put("username", user.getUsername());
        userMap.put("role", user.getRole());
        userMap.put("name", user.getName());
        userMap.put("branchLocation", user.getBranchLocation());

        return ResponseEntity.ok(Map.of("token", token, "user", userMap));
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, Object> body) {
        try {
            String username = (String) body.get("username");
            String password = (String) body.get("password");
            String name = (String) body.get("name");
            String branchLocation = (String) body.getOrDefault("branchLocation", "");
            String rolePreference = (String) body.getOrDefault("rolePreference", "BranchOperator");

            if (username == null || password == null || name == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "name, username, and password are required"));
            }
            if (username.trim().length() < 3) {
                return ResponseEntity.badRequest().body(Map.of("error", "Username must be at least 3 characters"));
            }
            if (password.length() < 6) {
                return ResponseEntity.badRequest().body(Map.of("error", "Password must be at least 6 characters"));
            }
            if (userRepository.existsByUsername(username.trim())) {
                return ResponseEntity.badRequest().body(Map.of("error", "Username already taken"));
            }

            // Validate role preference
            User.UserRole role;
            try {
                role = User.UserRole.valueOf(rolePreference);
            } catch (Exception e) {
                role = User.UserRole.BranchOperator;
            }

            User user = User.builder()
                    .username(username.trim())
                    .passwordHash(passwordEncoder.encode(password))
                    .role(role)
                    .name(name.trim())
                    .branchLocation(branchLocation)
                    .isActive(false)      // not active until approved
                    .approvalStatus("PENDING")
                    .build();
            userRepository.save(user);

            return ResponseEntity.status(201).body(Map.of(
                    "message", "Registration submitted! An administrator will review your request.",
                    "username", user.getUsername()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(@AuthenticationPrincipal User user) {
        if (user == null) return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        Map<String, Object> userMap = new LinkedHashMap<>();
        userMap.put("userId", user.getUserId());
        userMap.put("username", user.getUsername());
        userMap.put("role", user.getRole());
        userMap.put("name", user.getName());
        userMap.put("branchLocation", user.getBranchLocation());
        return ResponseEntity.ok(Map.of("user", userMap));
    }

    @PatchMapping("/me")
    public ResponseEntity<?> updateMe(@AuthenticationPrincipal User user,
                                      @RequestBody Map<String, Object> body) {
        if (user == null) return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));

        // Re-fetch from DB to get latest state
        User dbUser = userRepository.findById(user.getUserId())
                .orElse(null);
        if (dbUser == null) return ResponseEntity.status(404).body(Map.of("error", "User not found"));

        String currentPassword = (String) body.get("currentPassword");
        if (currentPassword == null || !passwordEncoder.matches(currentPassword, dbUser.getPasswordHash())) {
            return ResponseEntity.status(400).body(Map.of("error", "Current password is incorrect"));
        }

        String newUsername = (String) body.get("newUsername");
        String newPassword = (String) body.get("newPassword");

        if (newUsername != null && !newUsername.isBlank()) {
            String trimmed = newUsername.trim();
            if (trimmed.length() < 3) {
                return ResponseEntity.badRequest().body(Map.of("error", "Username must be at least 3 characters"));
            }
            if (!trimmed.equals(dbUser.getUsername()) && userRepository.existsByUsername(trimmed)) {
                return ResponseEntity.badRequest().body(Map.of("error", "Username already taken"));
            }
            dbUser.setUsername(trimmed);
        }

        if (newPassword != null && !newPassword.isBlank()) {
            if (newPassword.length() < 6) {
                return ResponseEntity.badRequest().body(Map.of("error", "New password must be at least 6 characters"));
            }
            dbUser.setPasswordHash(passwordEncoder.encode(newPassword));
        }

        userRepository.save(dbUser);

        // Issue a fresh token with the (possibly new) username
        String newToken = jwtUtil.generateToken(dbUser.getUserId(), dbUser.getUsername(), dbUser.getRole().name());

        Map<String, Object> userMap = new LinkedHashMap<>();
        userMap.put("userId", dbUser.getUserId());
        userMap.put("username", dbUser.getUsername());
        userMap.put("role", dbUser.getRole());
        userMap.put("name", dbUser.getName());
        userMap.put("branchLocation", dbUser.getBranchLocation());

        return ResponseEntity.ok(Map.of("user", userMap, "token", newToken));
    }
}
