package com.tccs.repository;

import com.tccs.model.PricingRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PricingRuleRepository extends JpaRepository<PricingRule, UUID> {

    @Query("SELECT p FROM PricingRule p WHERE p.destination = :dest AND p.isActive = true " +
           "AND p.effectiveDate <= :today AND (p.expiryDate IS NULL OR p.expiryDate >= :today) " +
           "ORDER BY p.effectiveDate DESC")
    Optional<PricingRule> findActiveRuleForDestination(
            @Param("dest") String destination,
            @Param("today") LocalDate today);
}
