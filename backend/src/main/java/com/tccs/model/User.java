package com.tccs.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "users")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class User {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(name = "user_id", updatable = false, nullable = false)
    private UUID userId;

    @Column(unique = true, nullable = false, length = 50)
    private String username;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(length = 50)
    private UserRole role;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "branch_location", length = 100)
    private String branchLocation;

    @Column(name = "is_active")
    private Boolean isActive = true;

    // PENDING = awaiting admin approval, APPROVED = active, REJECTED = denied
    @Column(name = "approval_status", length = 20)
    private String approvalStatus = "APPROVED";

    @Column(name = "last_login")
    private OffsetDateTime lastLogin;

    @Column(name = "created_at")
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    public enum UserRole {
        BranchOperator, TransportManager, SystemAdministrator
    }

    @PrePersist
    protected void onCreate() {
        createdAt = OffsetDateTime.now();
        updatedAt = OffsetDateTime.now();
        if (isActive == null) isActive = true;
        if (approvalStatus == null) approvalStatus = "APPROVED";
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
