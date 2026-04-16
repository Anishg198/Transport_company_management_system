package com.tccs.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tccs.model.Bill;
import com.tccs.model.Consignment;
import com.tccs.model.User;
import com.tccs.repository.BillRepository;
import com.tccs.repository.ConsignmentRepository;
import com.tccs.repository.TruckRepository;
import com.tccs.service.AllocationService;
import com.tccs.service.BillService;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/consignments")
@RequiredArgsConstructor
public class ConsignmentController {

    private final ConsignmentRepository consignmentRepository;
    private final TruckRepository truckRepository;
    private final BillRepository billRepository;
    private final BillService billService;
    private final AllocationService allocationService;
    private final ObjectMapper objectMapper;

    // GET /api/consignments
    @GetMapping
    public ResponseEntity<?> getAll(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String destination,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(defaultValue = "50") int limit,
            @RequestParam(defaultValue = "0") int offset) {

        List<Consignment> all = consignmentRepository.findAll();

        // Filter
        List<Consignment> filtered = all.stream()
                .filter(c -> status == null || c.getStatus().name().equals(status))
                .filter(c -> destination == null || c.getDestination().toLowerCase().contains(destination.toLowerCase()))
                .filter(c -> search == null || c.getConsignmentNumber().toLowerCase().contains(search.toLowerCase())
                        || c.getSenderAddress().toLowerCase().contains(search.toLowerCase())
                        || c.getReceiverAddress().toLowerCase().contains(search.toLowerCase()))
                .filter(c -> startDate == null || !c.getRegistrationTimestamp().isBefore(
                        OffsetDateTime.parse(startDate + "T00:00:00Z")))
                .filter(c -> endDate == null || !c.getRegistrationTimestamp().isAfter(
                        OffsetDateTime.parse(endDate + "T23:59:59Z")))
                .sorted(Comparator.comparing(Consignment::getRegistrationTimestamp).reversed())
                .collect(Collectors.toList());

        int total = filtered.size();
        List<Consignment> page = filtered.stream().skip(offset).limit(limit).collect(Collectors.toList());

        // Enrich with truck info
        List<Map<String, Object>> enriched = page.stream().map(c -> {
            Map<String, Object> m = toMap(c);
            if (c.getAssignedTruckId() != null) {
                truckRepository.findById(c.getAssignedTruckId()).ifPresent(t -> {
                    m.put("truck_reg_number", t.getRegistrationNumber());
                    m.put("truck_driver", t.getDriverName());
                });
            }
            return m;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(Map.of("consignments", enriched, "total", total, "limit", limit, "offset", offset));
    }

    // POST /api/consignments
    @PostMapping
    @PreAuthorize("hasAnyRole('BranchOperator','SystemAdministrator')")
    public ResponseEntity<?> create(@RequestBody Map<String, Object> body,
                                     @AuthenticationPrincipal User user) {
        try {
            BigDecimal volume = new BigDecimal(body.get("volume").toString());
            String destination = (String) body.get("destination");
            String senderAddress = (String) body.get("senderAddress");
            String receiverAddress = (String) body.get("receiverAddress");

            if (volume == null || destination == null || senderAddress == null || receiverAddress == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "volume, destination, senderAddress, receiverAddress are required"));
            }
            if (volume.compareTo(BigDecimal.ZERO) <= 0) {
                return ResponseEntity.badRequest().body(Map.of("error", "Volume must be positive"));
            }

            OffsetDateTime now = OffsetDateTime.now();
            // Generate sequence number
            OffsetDateTime startOfDay = now.toLocalDate().atStartOfDay().atOffset(ZoneOffset.UTC);
            OffsetDateTime endOfDay = startOfDay.plusDays(1).minusNanos(1);
            long todayCount = consignmentRepository.countTodaysConsignments(startOfDay);
            int sequence = (int) (todayCount + 1);

            String consignmentNumber = String.format("TCCS-%s-%04d",
                    now.format(DateTimeFormatter.ofPattern("yyyyMMdd")), sequence);

            Map<String, Object> logEntry = new LinkedHashMap<>();
            logEntry.put("oldStatus", null);
            logEntry.put("newStatus", "Registered");
            logEntry.put("timestamp", now.toString());
            logEntry.put("note", "Consignment registered");
            String statusLog = objectMapper.writeValueAsString(List.of(logEntry));

            Consignment consignment = Consignment.builder()
                    .consignmentNumber(consignmentNumber)
                    .volume(volume)
                    .destination(destination)
                    .senderAddress(senderAddress)
                    .receiverAddress(receiverAddress)
                    .registrationTimestamp(now)
                    .status(Consignment.ConsignmentStatus.Registered)
                    .statusChangeLog(statusLog)
                    .createdBy(user != null ? user.getUserId() : null)
                    // Explicitly set timestamps: Spring Data calls merge() (not persist())
                    // for entities with a non-null custom String ID, skipping @PrePersist.
                    .createdAt(now)
                    .updatedAt(now)
                    .build();

            consignmentRepository.save(consignment);

            // Generate bill (gracefully handle missing pricing rule)
            BillService.BillResult billResult = null;
            String billingWarning = null;
            try {
                billResult = billService.generateBill(consignmentNumber, volume, destination, now);
            } catch (Exception billEx) {
                billingWarning = "No active pricing rule found for destination: " + destination
                        + ". Please set up pricing rules and generate the bill manually.";
            }

            // Trigger allocation
            AllocationService.AllocationResult allocationResult =
                    allocationService.checkAndTriggerAllocation(destination);

            // Reload consignment (charges may have been updated by billing)
            Consignment saved = consignmentRepository.findById(consignmentNumber).orElse(consignment);

            Map<String, Object> response = new LinkedHashMap<>();
            response.put("consignment", toMap(saved));
            response.put("bill", billResult != null ? billToMap(billResult.bill()) : null);
            response.put("pricingBreakdown", billResult != null ? billResult.pricingBreakdown() : null);
            response.put("allocationTriggered", allocationResult.triggered());
            response.put("allocationDetails", allocationResultToMap(allocationResult));
            if (billingWarning != null) response.put("billingWarning", billingWarning);
            return ResponseEntity.status(201).body(response);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // GET /api/consignments/:id
    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable String id) {
        return consignmentRepository.findById(id).map(c -> {
            Map<String, Object> consMap = toMap(c);
            if (c.getAssignedTruckId() != null) {
                truckRepository.findById(c.getAssignedTruckId()).ifPresent(t -> {
                    consMap.put("truck_reg_number", t.getRegistrationNumber());
                    consMap.put("truck_driver", t.getDriverName());
                    consMap.put("truck_status", t.getStatus().name());
                    consMap.put("truck_location", t.getCurrentLocation());
                });
            }
            Optional<Bill> bill = billRepository.findFirstByConsignmentNumberOrderByCreatedAtDesc(id);
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("consignment", consMap);
            result.put("bill", bill.map(this::billToMap).orElse(null));
            return ResponseEntity.ok(result);
        }).orElse(ResponseEntity.notFound().build());
    }

    // PATCH /api/consignments/:id/status
    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable String id,
                                          @RequestBody Map<String, String> body,
                                          @AuthenticationPrincipal User user) {
        return consignmentRepository.findById(id).map(c -> {
            try {
                String newStatusStr = body.get("status");
                Consignment.ConsignmentStatus newStatus = Consignment.ConsignmentStatus.valueOf(newStatusStr);
                String note = body.getOrDefault("note", "Status updated to " + newStatusStr);

                List<Map<String, Object>> log = objectMapper.readValue(
                        c.getStatusChangeLog() != null ? c.getStatusChangeLog() : "[]",
                        objectMapper.getTypeFactory().constructCollectionType(List.class, Map.class));
                Map<String, Object> entry = new LinkedHashMap<>();
                entry.put("oldStatus", c.getStatus().name());
                entry.put("newStatus", newStatusStr);
                entry.put("timestamp", OffsetDateTime.now().toString());
                entry.put("note", note);
                if (user != null) entry.put("updatedBy", user.getName());
                log.add(entry);

                // If reverting to Registered or Pending, unassign the truck
                boolean revertingToUnassigned = (newStatus == Consignment.ConsignmentStatus.Registered
                        || newStatus == Consignment.ConsignmentStatus.Pending)
                        && c.getAssignedTruckId() != null;

                if (revertingToUnassigned) {
                    UUID truckId = c.getAssignedTruckId();
                    truckRepository.findById(truckId).ifPresent(truck -> {
                        try {
                            // Reduce truck cargo volume by this consignment's volume
                            BigDecimal newCargo = truck.getCargoVolume()
                                    .subtract(c.getVolume()).max(BigDecimal.ZERO);
                            truck.setCargoVolume(newCargo);

                            // Check remaining allocated consignments on this truck (excluding current)
                            long remaining = consignmentRepository.findByAssignedTruckId(truckId).stream()
                                    .filter(other -> !other.getConsignmentNumber().equals(id))
                                    .filter(other -> other.getStatus() == Consignment.ConsignmentStatus.AllocatedToTruck
                                            || other.getStatus() == Consignment.ConsignmentStatus.InTransit)
                                    .count();

                            if (remaining == 0) {
                                truck.setStatus(com.tccs.model.Truck.TruckStatus.Available);
                                truck.setDestination(null);
                                truck.setCargoVolume(BigDecimal.ZERO);
                            }

                            // Add entry to truck's status history
                            List<Map<String, Object>> truckLog = objectMapper.readValue(
                                    truck.getStatusHistory() != null ? truck.getStatusHistory() : "[]",
                                    objectMapper.getTypeFactory().constructCollectionType(List.class, Map.class));
                            Map<String, Object> truckEntry = new LinkedHashMap<>();
                            truckEntry.put("status", truck.getStatus().name());
                            truckEntry.put("timestamp", OffsetDateTime.now().toString());
                            truckEntry.put("note", "Consignment " + id + " unassigned (status reverted to " + newStatusStr + ")");
                            if (user != null) truckEntry.put("updatedBy", user.getName());
                            truckLog.add(truckEntry);
                            truck.setStatusHistory(objectMapper.writeValueAsString(truckLog));

                            truckRepository.save(truck);
                        } catch (Exception e) {
                            throw new RuntimeException(e);
                        }
                    });
                    c.setAssignedTruckId(null);
                }

                c.setStatus(newStatus);
                c.setStatusChangeLog(objectMapper.writeValueAsString(log));
                consignmentRepository.save(c);
                return ResponseEntity.ok(Map.of("consignment", toMap(c)));
            } catch (Exception e) {
                return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
            }
        }).orElse(ResponseEntity.notFound().build());
    }

    // DELETE /api/consignments/:id
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SystemAdministrator')")
    public ResponseEntity<?> delete(@PathVariable String id) {
        return consignmentRepository.findById(id).map(c -> {
            if (c.getStatus() == Consignment.ConsignmentStatus.InTransit ||
                c.getStatus() == Consignment.ConsignmentStatus.Delivered) {
                return ResponseEntity.badRequest().body(
                        Map.of("error", "Cannot delete consignment that is InTransit or Delivered"));
            }
            billRepository.findFirstByConsignmentNumberOrderByCreatedAtDesc(id)
                    .ifPresent(billRepository::delete);
            consignmentRepository.delete(c);
            return ResponseEntity.ok(Map.of("message", "Consignment deleted successfully"));
        }).orElse(ResponseEntity.notFound().build());
    }

    private Map<String, Object> toMap(Consignment c) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("consignment_number", c.getConsignmentNumber());
        m.put("volume", c.getVolume());
        m.put("destination", c.getDestination());
        m.put("sender_address", c.getSenderAddress());
        m.put("receiver_address", c.getReceiverAddress());
        m.put("registration_timestamp", c.getRegistrationTimestamp());
        m.put("status", c.getStatus().name());
        m.put("assigned_truck_id", c.getAssignedTruckId());
        m.put("transport_charges", c.getTransportCharges());
        m.put("status_change_log", parseJson(c.getStatusChangeLog()));
        m.put("created_at", c.getCreatedAt());
        m.put("updated_at", c.getUpdatedAt());
        return m;
    }

    private Map<String, Object> billToMap(Bill b) {
        if (b == null) return null;
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("bill_id", b.getBillId());
        m.put("consignment_number", b.getConsignmentNumber());
        m.put("transport_charges", b.getTransportCharges());
        m.put("registration_date", b.getRegistrationDate());
        m.put("pricing_breakdown", parseJson(b.getPricingBreakdown()));
        m.put("created_at", b.getCreatedAt());
        return m;
    }

    private Object parseJson(String json) {
        if (json == null) return null;
        try {
            return objectMapper.readValue(json, Object.class);
        } catch (Exception e) {
            return json;
        }
    }

    private Map<String, Object> allocationResultToMap(AllocationService.AllocationResult r) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("triggered", r.triggered());
        m.put("reason", r.reason());
        m.put("totalVolume", r.totalVolume());
        m.put("destination", r.destination());
        m.put("consignmentCount", r.consignmentCount());
        m.put("noTrucks", r.noTrucks());
        if (r.truckInfo() != null) m.put("truck", r.truckInfo());
        if (r.consignments() != null) m.put("consignments", r.consignments());
        return m;
    }
}
