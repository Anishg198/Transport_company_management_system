package com.tccs.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tccs.model.Bill;
import com.tccs.model.PricingRule;
import com.tccs.repository.BillRepository;
import com.tccs.repository.ConsignmentRepository;
import com.tccs.repository.PricingRuleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class BillService {

    private final PricingRuleRepository pricingRuleRepository;
    private final BillRepository billRepository;
    private final ConsignmentRepository consignmentRepository;
    private final ObjectMapper objectMapper;

    public record BillResult(Bill bill, BigDecimal finalCharge, Map<String, Object> pricingBreakdown) {}

    public BillResult generateBill(String consignmentNumber, BigDecimal volume,
                                   String destination, OffsetDateTime registrationDate) {
        PricingRule rule = pricingRuleRepository
                .findActiveRuleForDestination(destination, LocalDate.now())
                .orElseThrow(() -> new RuntimeException(
                        "No active pricing rule found for destination: " + destination));

        BigDecimal baseCharge = volume.multiply(rule.getRatePerCubicMeter())
                .setScale(2, RoundingMode.HALF_UP);
        BigDecimal finalCharge = baseCharge.max(rule.getMinimumCharge())
                .setScale(2, RoundingMode.HALF_UP);
        String appliedRule = finalCharge.compareTo(rule.getMinimumCharge()) == 0 &&
                             baseCharge.compareTo(rule.getMinimumCharge()) < 0 ? "minimum" : "rate";

        Map<String, Object> breakdown = new HashMap<>();
        breakdown.put("volume", volume);
        breakdown.put("destination", destination);
        breakdown.put("ratePerCubicMeter", rule.getRatePerCubicMeter());
        breakdown.put("minimumCharge", rule.getMinimumCharge());
        breakdown.put("baseCharge", baseCharge);
        breakdown.put("finalCharge", finalCharge);
        breakdown.put("appliedRule", appliedRule);
        breakdown.put("calculatedAt", OffsetDateTime.now().toString());

        String breakdownJson;
        try {
            breakdownJson = objectMapper.writeValueAsString(breakdown);
        } catch (Exception e) {
            breakdownJson = "{}";
        }

        Bill bill = Bill.builder()
                .consignmentNumber(consignmentNumber)
                .transportCharges(finalCharge)
                .registrationDate(registrationDate != null ? registrationDate : OffsetDateTime.now())
                .pricingBreakdown(breakdownJson)
                .build();

        billRepository.save(bill);

        // Update consignment charges
        consignmentRepository.findById(consignmentNumber).ifPresent(c -> {
            c.setTransportCharges(finalCharge);
            consignmentRepository.save(c);
        });

        return new BillResult(bill, finalCharge, breakdown);
    }
}
