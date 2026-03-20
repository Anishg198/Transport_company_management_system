package com.tccs.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tccs.model.Consignment;
import com.tccs.model.DispatchDocument;
import com.tccs.model.Truck;
import com.tccs.model.User;
import com.tccs.repository.ConsignmentRepository;
import com.tccs.repository.DispatchDocumentRepository;
import com.tccs.repository.TruckRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/dispatch")
@RequiredArgsConstructor
public class DispatchController {

    private final DispatchDocumentRepository dispatchRepository;
    private final TruckRepository truckRepository;
    private final ConsignmentRepository consignmentRepository;
    private final ObjectMapper objectMapper;

    @GetMapping
    public ResponseEntity<?> getAll(@RequestParam(required = false) String status,
                                     @RequestParam(required = false) String destination) {
        List<DispatchDocument> docs = dispatchRepository.findAllByOrderByDispatchTimestampDesc();
        if (status != null) {
            DispatchDocument.DispatchStatus ds = DispatchDocument.DispatchStatus.valueOf(status);
            docs = docs.stream().filter(d -> d.getDispatchStatus() == ds).collect(Collectors.toList());
        }
        if (destination != null) {
            String dest = destination.toLowerCase();
            docs = docs.stream().filter(d -> d.getDestination().toLowerCase().contains(dest)).collect(Collectors.toList());
        }
        List<Map<String, Object>> enriched = docs.stream().map(d -> {
            Map<String, Object> m = toMap(d);
            truckRepository.findById(d.getTruckId()).ifPresent(t -> m.put("truck_reg_number", t.getRegistrationNumber()));
            return m;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(Map.of("dispatches", enriched));
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, Object> body,
                                     @AuthenticationPrincipal User user) {
        try {
            String truckIdStr = (String) body.get("truckId");
            if (truckIdStr == null) return ResponseEntity.badRequest().body(Map.of("error", "truckId is required"));

            UUID truckId = UUID.fromString(truckIdStr);
            Truck truck = truckRepository.findById(truckId)
                    .orElseThrow(() -> new RuntimeException("Truck not found"));

            if (truck.getStatus() != Truck.TruckStatus.Allocated && truck.getStatus() != Truck.TruckStatus.Loading) {
                return ResponseEntity.badRequest().body(Map.of("error",
                        "Truck must be in Allocated or Loading status (current: " + truck.getStatus() + ")"));
            }

            OffsetDateTime now = OffsetDateTime.now();

            List<Consignment> consignments = consignmentRepository.findByAssignedTruckId(truckId)
                    .stream().filter(c -> c.getStatus() == Consignment.ConsignmentStatus.AllocatedToTruck)
                    .collect(Collectors.toList());

            // Fallback: if truck is Allocated but no AllocatedToTruck consignments found,
            // check for Pending/Registered consignments for the truck's destination
            if (consignments.isEmpty() && truck.getDestination() != null) {
                List<Consignment> pending = consignmentRepository.findByDestinationAndStatusIn(
                        truck.getDestination(),
                        List.of(Consignment.ConsignmentStatus.Pending, Consignment.ConsignmentStatus.Registered));
                for (Consignment c : pending) {
                    List<Map<String, Object>> cLog = objectMapper.readValue(
                            c.getStatusChangeLog() != null ? c.getStatusChangeLog() : "[]",
                            objectMapper.getTypeFactory().constructCollectionType(List.class, Map.class));
                    cLog.add(Map.of("oldStatus", c.getStatus().name(), "newStatus", "AllocatedToTruck",
                            "timestamp", now.toString(), "note", "Auto-assigned during dispatch to truck " + truck.getRegistrationNumber()));
                    c.setStatus(Consignment.ConsignmentStatus.AllocatedToTruck);
                    c.setAssignedTruckId(truckId);
                    c.setStatusChangeLog(objectMapper.writeValueAsString(cLog));
                    consignmentRepository.save(c);
                }
                consignments = pending;
            }

            if (consignments.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error",
                        "No consignments allocated to this truck. Use 'Assign Consignments' to manually assign pending consignments first."));
            }

            BigDecimal totalVolume = consignments.stream()
                    .map(Consignment::getVolume)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            OffsetDateTime departure = body.get("departureTime") != null
                    ? parseFlexibleDateTime((String) body.get("departureTime")) : now;

            List<Map<String, Object>> manifest = consignments.stream().map(c -> {
                Map<String, Object> item = new LinkedHashMap<>();
                item.put("consignmentNumber", c.getConsignmentNumber());
                item.put("volume", c.getVolume());
                item.put("senderAddress", c.getSenderAddress());
                item.put("receiverAddress", c.getReceiverAddress());
                item.put("charges", c.getTransportCharges());
                return item;
            }).collect(Collectors.toList());

            DispatchDocument dispatch = DispatchDocument.builder()
                    .truckId(truckId)
                    .destination(truck.getDestination())
                    .dispatchTimestamp(now)
                    .totalConsignments(consignments.size())
                    .totalVolume(totalVolume)
                    .driverName(truck.getDriverName())
                    .departureTime(departure)
                    .dispatchStatus(DispatchDocument.DispatchStatus.Dispatched)
                    .consignmentManifest(objectMapper.writeValueAsString(manifest))
                    .createdBy(user != null ? user.getUserId() : null)
                    .build();

            dispatchRepository.save(dispatch);

            // Update truck to InTransit
            List<Map<String, Object>> truckLog = objectMapper.readValue(
                    truck.getStatusHistory() != null ? truck.getStatusHistory() : "[]",
                    objectMapper.getTypeFactory().constructCollectionType(List.class, Map.class));
            truckLog.add(Map.of("status", "InTransit", "timestamp", now.toString(),
                    "note", "Dispatch document generated, departed for " + truck.getDestination()));
            truck.setStatus(Truck.TruckStatus.InTransit);
            truck.setStatusHistory(objectMapper.writeValueAsString(truckLog));
            truckRepository.save(truck);

            // Update consignments to InTransit
            for (Consignment c : consignments) {
                List<Map<String, Object>> cLog = objectMapper.readValue(
                        c.getStatusChangeLog() != null ? c.getStatusChangeLog() : "[]",
                        objectMapper.getTypeFactory().constructCollectionType(List.class, Map.class));
                cLog.add(Map.of("oldStatus", "AllocatedToTruck", "newStatus", "InTransit",
                        "timestamp", now.toString(),
                        "note", "Truck dispatched - dispatch ID: " + dispatch.getDispatchId()));
                c.setStatus(Consignment.ConsignmentStatus.InTransit);
                c.setStatusChangeLog(objectMapper.writeValueAsString(cLog));
                consignmentRepository.save(c);
            }

            return ResponseEntity.status(201).body(Map.of(
                    "dispatch", toMap(dispatch),
                    "consignmentsUpdated", consignments.size()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable UUID id) {
        return dispatchRepository.findById(id).map(d -> {
            Map<String, Object> m = toMap(d);
            truckRepository.findById(d.getTruckId()).ifPresent(t -> {
                m.put("truck_reg_number", t.getRegistrationNumber());
                m.put("truck_capacity", t.getCapacity());
            });
            return ResponseEntity.ok(Map.of("dispatch", m));
        }).orElse(ResponseEntity.notFound().build());
    }

    private Map<String, Object> toMap(DispatchDocument d) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("dispatch_id", d.getDispatchId());
        m.put("truck_id", d.getTruckId());
        m.put("destination", d.getDestination());
        m.put("dispatch_timestamp", d.getDispatchTimestamp());
        m.put("total_consignments", d.getTotalConsignments());
        m.put("total_volume", d.getTotalVolume());
        m.put("driver_name", d.getDriverName());
        m.put("departure_time", d.getDepartureTime());
        m.put("arrival_time", d.getArrivalTime());
        m.put("dispatch_status", d.getDispatchStatus().name());
        m.put("consignment_manifest", parseJson(d.getConsignmentManifest()));
        m.put("created_by", d.getCreatedBy());
        m.put("created_at", d.getCreatedAt());
        return m;
    }

    private OffsetDateTime parseFlexibleDateTime(String s) {
        if (s == null) return OffsetDateTime.now();
        try {
            return OffsetDateTime.parse(s);
        } catch (Exception e) {
            try {
                return LocalDateTime.parse(s, DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm"))
                        .atZone(ZoneId.systemDefault()).toOffsetDateTime();
            } catch (Exception e2) {
                try {
                    return LocalDateTime.parse(s).atZone(ZoneId.systemDefault()).toOffsetDateTime();
                } catch (Exception e3) {
                    return OffsetDateTime.now();
                }
            }
        }
    }

    private Object parseJson(String json) {
        if (json == null) return null;
        try { return objectMapper.readValue(json, Object.class); }
        catch (Exception e) { return json; }
    }
}
