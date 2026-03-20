package com.tccs.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "bills")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Bill {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(name = "bill_id", updatable = false, nullable = false)
    private UUID billId;

    @Column(name = "consignment_number", nullable = false, length = 30)
    private String consignmentNumber;

    @Column(name = "transport_charges", nullable = false, precision = 10, scale = 2)
    private BigDecimal transportCharges;

    @Column(name = "registration_date")
    private OffsetDateTime registrationDate;

    @Column(name = "pricing_breakdown", columnDefinition = "text", nullable = false)
    private String pricingBreakdown;

    @Column(name = "created_at")
    private OffsetDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (registrationDate == null) registrationDate = OffsetDateTime.now();
        createdAt = OffsetDateTime.now();
    }
}
