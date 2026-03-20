package com.tccs.controller;

import com.tccs.model.User;
import com.tccs.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SystemAdministrator')")
public class UserController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @GetMapping
    public ResponseEntity<?> getAll() {
        List<User> users = userRepository.findAll();
        users.sort(Comparator.comparing(User::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())));
        return ResponseEntity.ok(Map.of("users", users.stream().map(this::toSafeMap).collect(Collectors.toList())));
    }

    @GetMapping("/pending")
    public ResponseEntity<?> getPending() {
        List<User> pending = userRepository.findByApprovalStatus("PENDING");
        pending.sort(Comparator.comparing(User::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())));
        return ResponseEntity.ok(Map.of("users", pending.stream().map(this::toSafeMap).collect(Collectors.toList()),
                "count", pending.size()));
    }

    @PatchMapping("/{id}/approve")
    public ResponseEntity<?> approve(@PathVariable UUID id) {
        return userRepository.findById(id).map(user -> {
            user.setApprovalStatus("APPROVED");
            user.setIsActive(true);
            userRepository.save(user);
            return ResponseEntity.ok(Map.of("message", "User approved", "user", toSafeMap(user)));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/reject")
    public ResponseEntity<?> reject(@PathVariable UUID id) {
        return userRepository.findById(id).map(user -> {
            user.setApprovalStatus("REJECTED");
            user.setIsActive(false);
            userRepository.save(user);
            return ResponseEntity.ok(Map.of("message", "User rejected", "user", toSafeMap(user)));
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/stats")
    public ResponseEntity<?> stats() {
        List<User> all = userRepository.findAll();
        java.time.OffsetDateTime yesterday = java.time.OffsetDateTime.now().minusDays(1);
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("active_users", all.stream().filter(u -> Boolean.TRUE.equals(u.getIsActive())).count());
        stats.put("operators", all.stream().filter(u -> u.getRole() == User.UserRole.BranchOperator).count());
        stats.put("managers", all.stream().filter(u -> u.getRole() == User.UserRole.TransportManager).count());
        stats.put("admins", all.stream().filter(u -> u.getRole() == User.UserRole.SystemAdministrator).count());
        stats.put("active_today", all.stream().filter(u -> u.getLastLogin() != null && u.getLastLogin().isAfter(yesterday)).count());
        return ResponseEntity.ok(Map.of("stats", stats));
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, Object> body) {
        try {
            String username = (String) body.get("username");
            String password = (String) body.get("password");
            String roleStr = (String) body.get("role");
            String name = (String) body.get("name");

            if (username == null || password == null || roleStr == null || name == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "username, password, role, name are required"));
            }
            if (userRepository.existsByUsername(username)) {
                return ResponseEntity.badRequest().body(Map.of("error", "Username already exists"));
            }

            User user = User.builder()
                    .username(username)
                    .passwordHash(passwordEncoder.encode(password))
                    .role(User.UserRole.valueOf(roleStr))
                    .name(name)
                    .branchLocation((String) body.getOrDefault("branchLocation", ""))
                    .isActive(true)
                    .build();
            userRepository.save(user);
            return ResponseEntity.status(201).body(Map.of("user", toSafeMap(user)));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable UUID id, @RequestBody Map<String, Object> body) {
        return userRepository.findById(id).map(user -> {
            if (body.containsKey("name")) user.setName((String) body.get("name"));
            if (body.containsKey("branchLocation")) user.setBranchLocation((String) body.get("branchLocation"));
            if (body.containsKey("isActive")) user.setIsActive((Boolean) body.get("isActive"));
            if (body.containsKey("role")) user.setRole(User.UserRole.valueOf((String) body.get("role")));
            userRepository.save(user);
            return ResponseEntity.ok(Map.of("user", toSafeMap(user)));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable UUID id, @AuthenticationPrincipal User currentUser) {
        if (currentUser != null && currentUser.getUserId().equals(id)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Cannot delete your own account"));
        }
        return userRepository.findById(id).map(user -> {
            user.setIsActive(false);
            userRepository.save(user);
            return ResponseEntity.ok(Map.of("message", "User deactivated successfully"));
        }).orElse(ResponseEntity.notFound().build());
    }

    private Map<String, Object> toSafeMap(User u) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("user_id", u.getUserId());
        m.put("username", u.getUsername());
        m.put("role", u.getRole().name());
        m.put("name", u.getName());
        m.put("branch_location", u.getBranchLocation());
        m.put("is_active", u.getIsActive());
        m.put("approval_status", u.getApprovalStatus() != null ? u.getApprovalStatus() : "APPROVED");
        m.put("last_login", u.getLastLogin());
        m.put("created_at", u.getCreatedAt());
        return m;
    }
}
