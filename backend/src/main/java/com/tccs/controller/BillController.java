package com.tccs.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tccs.model.Bill;
import com.tccs.model.Consignment;
import com.tccs.repository.BillRepository;
import com.tccs.repository.ConsignmentRepository;
import com.tccs.service.BillService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/bills")
@RequiredArgsConstructor
public class BillController {

    private final BillRepository billRepository;
    private final ConsignmentRepository consignmentRepository;
    private final BillService billService;
    private final ObjectMapper objectMapper;

    @GetMapping("/{consignmentNumber}")
    public ResponseEntity<?> getByConsignment(@PathVariable String consignmentNumber) {
        Optional<Bill> bill = billRepository.findFirstByConsignmentNumberOrderByCreatedAtDesc(consignmentNumber);
        if (bill.isEmpty()) return ResponseEntity.notFound().build();

        Optional<Consignment> consignment = consignmentRepository.findById(consignmentNumber);
        return ResponseEntity.ok(Map.of(
                "bill", toMap(bill.get()),
                "consignment", consignment.map(this::consToMap).orElse(null)
        ));
    }

    @PostMapping("/generate")
    public ResponseEntity<?> generate(@RequestBody Map<String, String> body) {
        String consignmentNumber = body.get("consignmentNumber");
        if (consignmentNumber == null) return ResponseEntity.badRequest().body(Map.of("error", "consignmentNumber is required"));

        return consignmentRepository.findById(consignmentNumber).map(c -> {
            try {
                BillService.BillResult result = billService.generateBill(
                        consignmentNumber, c.getVolume(), c.getDestination(), c.getRegistrationTimestamp());
                return ResponseEntity.status(201).body(Map.of(
                        "bill", toMap(result.bill()),
                        "finalCharge", result.finalCharge(),
                        "pricingBreakdown", result.pricingBreakdown()
                ));
            } catch (Exception e) {
                return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
            }
        }).orElse(ResponseEntity.notFound().build());
    }

    private Map<String, Object> toMap(Bill b) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("bill_id", b.getBillId());
        m.put("consignment_number", b.getConsignmentNumber());
        m.put("transport_charges", b.getTransportCharges());
        m.put("registration_date", b.getRegistrationDate());
        m.put("pricing_breakdown", parseJson(b.getPricingBreakdown()));
        m.put("created_at", b.getCreatedAt());
        return m;
    }

    private Map<String, Object> consToMap(Consignment c) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("consignment_number", c.getConsignmentNumber());
        m.put("volume", c.getVolume());
        m.put("destination", c.getDestination());
        m.put("sender_address", c.getSenderAddress());
        m.put("receiver_address", c.getReceiverAddress());
        m.put("status", c.getStatus().name());
        m.put("registration_timestamp", c.getRegistrationTimestamp());
        m.put("transport_charges", c.getTransportCharges());
        return m;
    }

    private Object parseJson(String json) {
        if (json == null) return null;
        try { return objectMapper.readValue(json, Object.class); }
        catch (Exception e) { return json; }
    }
}
