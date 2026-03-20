package com.tccs.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "consignments")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Consignment {

    @Id
    @Column(name = "consignment_number", length = 30)
    private String consignmentNumber;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal volume;

    @Column(nullable = false, length = 100)
    private String destination;

    @Column(name = "sender_address", nullable = false, columnDefinition = "TEXT")
    private String senderAddress;

    @Column(name = "receiver_address", nullable = false, columnDefinition = "TEXT")
    private String receiverAddress;

    @Column(name = "registration_timestamp")
    private OffsetDateTime registrationTimestamp;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private ConsignmentStatus status = ConsignmentStatus.Registered;

    @Column(name = "assigned_truck_id")
    private UUID assignedTruckId;

    @Column(name = "transport_charges", precision = 10, scale = 2)
    private BigDecimal transportCharges;

    @Column(name = "status_change_log", columnDefinition = "text")
    private String statusChangeLog = "[]";

    @Column(name = "created_by")
    private UUID createdBy;

    @Column(name = "created_at")
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    public enum ConsignmentStatus {
        Registered, Pending, AllocatedToTruck, InTransit, Delivered, Cancelled
    }

    @PrePersist
    protected void onCreate() {
        if (registrationTimestamp == null) registrationTimestamp = OffsetDateTime.now();
        createdAt = OffsetDateTime.now();
        updatedAt = OffsetDateTime.now();
        if (statusChangeLog == null) statusChangeLog = "[]";
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
