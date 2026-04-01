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
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/trucks")
@RequiredArgsConstructor
public class TruckController {

    private final TruckRepository truckRepository;
    private final ConsignmentRepository consignmentRepository;
    private final DispatchDocumentRepository dispatchRepository;
    private final ObjectMapper objectMapper;

    @GetMapping
    public ResponseEntity<?> getAll(@RequestParam(required = false) String status,
                                     @RequestParam(required = false) String destination) {
        List<Truck> trucks = truckRepository.findAll();
        if (status != null) {
            Truck.TruckStatus ts = Truck.TruckStatus.valueOf(status);
            trucks = trucks.stream().filter(t -> t.getStatus() == ts).collect(Collectors.toList());
        }
        if (destination != null) {
            String dest = destination.toLowerCase();
            trucks = trucks.stream()
                    .filter(t -> t.getDestination() != null && t.getDestination().toLowerCase().contains(dest))
                    .collect(Collectors.toList());
        }
        trucks.sort(Comparator.comparing(Truck::getUpdatedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed());
        return ResponseEntity.ok(Map.of("trucks", trucks.stream().map(this::toMap).collect(Collectors.toList())));
    }

    @GetMapping("/available")
    public ResponseEntity<?> getAvailable() {
        List<Truck> trucks = truckRepository.findAvailableTrucks();
        return ResponseEntity.ok(Map.of("trucks", trucks.stream().map(this::toMap).collect(Collectors.toList())));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable UUID id) {
        return truckRepository.findById(id).map(truck -> {
            List<Consignment> consignments = consignmentRepository.findByAssignedTruckId(id);
            List<DispatchDocument> dispatches = dispatchRepository.findByTruckId(id);
            dispatches.sort(Comparator.comparing(DispatchDocument::getDispatchTimestamp, Comparator.nullsLast(Comparator.naturalOrder())).reversed());
            return ResponseEntity.ok(Map.of(
                    "truck", toMap(truck),
                    "consignments", consignments.stream().map(this::consToMap).collect(Collectors.toList()),
                    "dispatches", dispatches.stream().map(this::dispToMap).collect(Collectors.toList())
            ));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('TransportManager','SystemAdministrator')")
    public ResponseEntity<?> create(@RequestBody Map<String, Object> body) {
        try {
            String reg = (String) body.get("registrationNumber");
            if (truckRepository.existsByRegistrationNumber(reg)) {
                return ResponseEntity.badRequest().body(Map.of("error", "Truck with this registration number already exists"));
            }
            String historyJson = objectMapper.writeValueAsString(List.of(Map.of(
                    "status", "Available", "timestamp", OffsetDateTime.now().toString(), "note", "Truck registered"
            )));
            Truck truck = Truck.builder()
                    .registrationNumber(reg)
                    .capacity(new BigDecimal(body.get("capacity").toString()))
                    .driverName((String) body.get("driverName"))
                    .driverLicense((String) body.get("driverLicense"))
                    .status(Truck.TruckStatus.Available)
                    .currentLocation((String) body.getOrDefault("currentLocation", ""))
                    .cargoVolume(BigDecimal.ZERO)
                    .statusHistory(historyJson)
                    .build();
            truckRepository.save(truck);
            return ResponseEntity.status(201).body(Map.of("truck", toMap(truck)));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('TransportManager','SystemAdministrator')")
    public ResponseEntity<?> updateStatus(@PathVariable UUID id,
                                          @RequestBody Map<String, Object> body,
                                          @AuthenticationPrincipal User user) {
        return truckRepository.findById(id).map(truck -> {
            try {
                String newStatusStr = (String) body.get("status");
                Truck.TruckStatus newStatus = Truck.TruckStatus.valueOf(newStatusStr);
                String note = (String) body.getOrDefault("note", "Status changed to " + newStatusStr);
                boolean wasInTransit = truck.getStatus() == Truck.TruckStatus.InTransit;

                List<Map<String, Object>> log = objectMapper.readValue(
                        truck.getStatusHistory() != null ? truck.getStatusHistory() : "[]",
                        objectMapper.getTypeFactory().constructCollectionType(List.class, Map.class));
                Map<String, Object> entry = new LinkedHashMap<>();
                entry.put("status", newStatusStr);
                entry.put("timestamp", OffsetDateTime.now().toString());
                entry.put("note", note);
                if (user != null) entry.put("updatedBy", user.getName());
                log.add(entry);

                truck.setStatus(newStatus);
                truck.setStatusHistory(objectMapper.writeValueAsString(log));

                if (body.containsKey("currentLocation")) truck.setCurrentLocation((String) body.get("currentLocation"));
                if (body.containsKey("destination")) truck.setDestination((String) body.get("destination"));
                if (newStatus == Truck.TruckStatus.Available) {
                    truck.setCargoVolume(BigDecimal.ZERO);
                    truck.setDestination(null);
                }
                truckRepository.save(truck);

                // If truck marked available after InTransit → deliver consignments
                if (newStatus == Truck.TruckStatus.Available && wasInTransit) {
                    List<Consignment> inTransit = consignmentRepository.findByAssignedTruckId(id)
                            .stream().filter(c -> c.getStatus() == Consignment.ConsignmentStatus.InTransit)
                            .collect(Collectors.toList());
                    for (Consignment c : inTransit) {
                        List<Map<String, Object>> cLog = objectMapper.readValue(
                                c.getStatusChangeLog() != null ? c.getStatusChangeLog() : "[]",
                                objectMapper.getTypeFactory().constructCollectionType(List.class, Map.class));
                        cLog.add(Map.of("oldStatus", "InTransit", "newStatus", "Delivered",
                                "timestamp", OffsetDateTime.now().toString(), "note", "Truck arrived at destination"));
                        c.setStatus(Consignment.ConsignmentStatus.Delivered);
                        c.setStatusChangeLog(objectMapper.writeValueAsString(cLog));
                        consignmentRepository.save(c);
                    }
                    dispatchRepository.findByTruckId(id).stream()
                            .filter(d -> d.getDispatchStatus() == DispatchDocument.DispatchStatus.InTransit)
                            .forEach(d -> {
                                d.setDispatchStatus(DispatchDocument.DispatchStatus.Delivered);
                                d.setArrivalTime(OffsetDateTime.now());
                                dispatchRepository.save(d);
                            });
                }
                return ResponseEntity.ok(Map.of("truck", toMap(truck)));
            } catch (Exception e) {
                return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
            }
        }).orElse(ResponseEntity.notFound().build());
    }

    private Map<String, Object> toMap(Truck t) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("truck_id", t.getTruckId());
        m.put("registration_number", t.getRegistrationNumber());
        m.put("capacity", t.getCapacity());
        m.put("driver_name", t.getDriverName());
        m.put("driver_license", t.getDriverLicense());
        m.put("status", t.getStatus().name());
        m.put("current_location", t.getCurrentLocation());
        m.put("cargo_volume", t.getCargoVolume());
        m.put("destination", t.getDestination());
        m.put("status_history", parseJson(t.getStatusHistory()));
        m.put("created_at", t.getCreatedAt());
        m.put("updated_at", t.getUpdatedAt());
        return m;
    }

    private Map<String, Object> consToMap(Consignment c) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("consignment_number", c.getConsignmentNumber());
        m.put("volume", c.getVolume());
        m.put("destination", c.getDestination());
        m.put("status", c.getStatus().name());
        m.put("registration_timestamp", c.getRegistrationTimestamp());
        m.put("transport_charges", c.getTransportCharges());
        return m;
    }

    private Map<String, Object> dispToMap(DispatchDocument d) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("dispatch_id", d.getDispatchId());
        m.put("destination", d.getDestination());
        m.put("dispatch_timestamp", d.getDispatchTimestamp());
        m.put("total_consignments", d.getTotalConsignments());
        m.put("total_volume", d.getTotalVolume());
        m.put("dispatch_status", d.getDispatchStatus().name());
        return m;
    }

    private Object parseJson(String json) {
        if (json == null) return null;
        try { return objectMapper.readValue(json, Object.class); }
        catch (Exception e) { return json; }
    }
}
