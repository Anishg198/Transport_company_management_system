package com.tccs.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "dispatch_documents")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DispatchDocument {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(name = "dispatch_id", updatable = false, nullable = false)
    private UUID dispatchId;

    @Column(name = "truck_id", nullable = false)
    private UUID truckId;

    @Column(nullable = false, length = 100)
    private String destination;

    @Column(name = "dispatch_timestamp")
    private OffsetDateTime dispatchTimestamp;

    @Column(name = "total_consignments", nullable = false)
    private Integer totalConsignments;

    @Column(name = "total_volume", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalVolume;

    @Column(name = "driver_name", nullable = false, length = 100)
    private String driverName;

    @Column(name = "departure_time")
    private OffsetDateTime departureTime;

    @Column(name = "arrival_time")
    private OffsetDateTime arrivalTime;

    @Enumerated(EnumType.STRING)
    @Column(name = "dispatch_status", length = 30)
    private DispatchStatus dispatchStatus = DispatchStatus.Dispatched;

    @Column(name = "consignment_manifest", columnDefinition = "text")
    private String consignmentManifest = "[]";

    @Column(name = "created_by")
    private UUID createdBy;

    @Column(name = "created_at")
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    public enum DispatchStatus {
        Dispatched, InTransit, Delivered, Cancelled
    }

    @PrePersist
    protected void onCreate() {
        if (dispatchTimestamp == null) dispatchTimestamp = OffsetDateTime.now();
        createdAt = OffsetDateTime.now();
        updatedAt = OffsetDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
