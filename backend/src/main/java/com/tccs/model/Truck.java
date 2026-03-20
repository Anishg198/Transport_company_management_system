package com.tccs.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "trucks")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Truck {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(name = "truck_id", updatable = false, nullable = false)
    private UUID truckId;

    @Column(name = "registration_number", unique = true, nullable = false, length = 20)
    private String registrationNumber;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal capacity;

    @Column(name = "driver_name", nullable = false, length = 100)
    private String driverName;

    @Column(name = "driver_license", nullable = false, length = 50)
    private String driverLicense;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private TruckStatus status = TruckStatus.Available;

    @Column(name = "current_location", length = 100)
    private String currentLocation;

    @Column(name = "cargo_volume", precision = 10, scale = 2)
    private BigDecimal cargoVolume = BigDecimal.ZERO;

    @Column(length = 100)
    private String destination;

    @Column(name = "status_history", columnDefinition = "text")
    private String statusHistory = "[]";

    @Column(name = "created_at")
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    public enum TruckStatus {
        Available, Allocated, InTransit, Loading, Unloading, UnderMaintenance
    }

    @PrePersist
    protected void onCreate() {
        createdAt = OffsetDateTime.now();
        updatedAt = OffsetDateTime.now();
        if (cargoVolume == null) cargoVolume = BigDecimal.ZERO;
        if (statusHistory == null) statusHistory = "[]";
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
