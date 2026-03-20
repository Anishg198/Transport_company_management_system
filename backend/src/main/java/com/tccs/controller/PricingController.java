package com.tccs.controller;

import com.tccs.model.PricingRule;
import com.tccs.repository.PricingRuleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/pricing-rules")
@RequiredArgsConstructor
public class PricingController {

    private final PricingRuleRepository pricingRuleRepository;

    @GetMapping
    public ResponseEntity<?> getAll() {
        List<PricingRule> rules = pricingRuleRepository.findAll();
        rules.sort((a, b) -> {
            int d = a.getDestination().compareTo(b.getDestination());
            return d != 0 ? d : b.getEffectiveDate().compareTo(a.getEffectiveDate());
        });
        return ResponseEntity.ok(Map.of("pricingRules", rules));
    }

    @PostMapping
    @PreAuthorize("hasRole('SystemAdministrator')")
    public ResponseEntity<?> create(@RequestBody Map<String, Object> body) {
        try {
            String destination = (String) body.get("destination");
            BigDecimal rate = new BigDecimal(body.get("ratePerCubicMeter").toString());
            BigDecimal minCharge = new BigDecimal(body.get("minimumCharge").toString());
            LocalDate effectiveDate = LocalDate.parse((String) body.get("effectiveDate"));
            LocalDate expiryDate = body.get("expiryDate") != null && !((String) body.get("expiryDate")).isBlank()
                    ? LocalDate.parse((String) body.get("expiryDate")) : null;

            // Deactivate overlapping rules if no expiry on new rule
            if (expiryDate == null) {
                pricingRuleRepository.findAll().stream()
                        .filter(r -> r.getDestination().equals(destination) && r.getIsActive()
                                && (r.getExpiryDate() == null || !r.getExpiryDate().isBefore(effectiveDate)))
                        .forEach(r -> { r.setIsActive(false); pricingRuleRepository.save(r); });
            }

            PricingRule rule = PricingRule.builder()
                    .destination(destination)
                    .ratePerCubicMeter(rate)
                    .minimumCharge(minCharge)
                    .effectiveDate(effectiveDate)
                    .expiryDate(expiryDate)
                    .isActive(true)
                    .build();
            pricingRuleRepository.save(rule);
            return ResponseEntity.status(201).body(Map.of("pricingRule", rule));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SystemAdministrator')")
    public ResponseEntity<?> update(@PathVariable UUID id, @RequestBody Map<String, Object> body) {
        return pricingRuleRepository.findById(id).map(rule -> {
            if (body.containsKey("destination")) rule.setDestination((String) body.get("destination"));
            if (body.containsKey("ratePerCubicMeter"))
                rule.setRatePerCubicMeter(new BigDecimal(body.get("ratePerCubicMeter").toString()));
            if (body.containsKey("minimumCharge"))
                rule.setMinimumCharge(new BigDecimal(body.get("minimumCharge").toString()));
            if (body.containsKey("effectiveDate"))
                rule.setEffectiveDate(LocalDate.parse((String) body.get("effectiveDate")));
            if (body.containsKey("expiryDate")) {
                String exp = (String) body.get("expiryDate");
                rule.setExpiryDate(exp != null && !exp.isBlank() ? LocalDate.parse(exp) : null);
            }
            if (body.containsKey("isActive")) rule.setIsActive((Boolean) body.get("isActive"));
            pricingRuleRepository.save(rule);
            return ResponseEntity.ok(Map.of("pricingRule", rule));
        }).orElse(ResponseEntity.notFound().build());
    }
}
