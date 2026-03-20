package com.tccs.controller;

import com.tccs.service.AllocationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/allocation")
@RequiredArgsConstructor
public class AllocationController {

    private final AllocationService allocationService;

    @PostMapping("/trigger")
    @PreAuthorize("hasAnyRole('TransportManager','SystemAdministrator')")
    public ResponseEntity<?> trigger(@RequestBody Map<String, String> body) {
        String destination = body.get("destination");
        if (destination == null || destination.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "destination is required"));
        }
        try {
            AllocationService.AllocationResult result = allocationService.checkAndTriggerAllocation(destination);
            return ResponseEntity.ok(Map.of(
                    "triggered", result.triggered(),
                    "reason", result.reason(),
                    "totalVolume", result.totalVolume(),
                    "destination", result.destination(),
                    "consignmentCount", result.consignmentCount(),
                    "noTrucks", result.noTrucks()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/pending-volumes")
    public ResponseEntity<?> pendingVolumes() {
        return ResponseEntity.ok(Map.of("pendingVolumes", allocationService.getPendingVolumes()));
    }

    @PostMapping("/manual-assign")
    @PreAuthorize("hasAnyRole('TransportManager','SystemAdministrator')")
    public ResponseEntity<?> manualAssign(@RequestBody Map<String, Object> body) {
        String truckIdStr = (String) body.get("truckId");
        @SuppressWarnings("unchecked")
        List<String> consignmentIds = (List<String>) body.get("consignmentIds");
        if (truckIdStr == null) return ResponseEntity.badRequest().body(Map.of("error", "truckId required"));
        if (consignmentIds == null || consignmentIds.isEmpty())
            return ResponseEntity.badRequest().body(Map.of("error", "consignmentIds required"));
        try {
            AllocationService.AllocationResult result = allocationService.manualAssignToTruck(
                    UUID.fromString(truckIdStr), consignmentIds);
            return ResponseEntity.ok(Map.of(
                    "triggered", result.triggered(),
                    "reason", result.reason(),
                    "totalVolume", result.totalVolume(),
                    "consignmentCount", result.consignmentCount(),
                    "truck", result.truckInfo()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/assignable-consignments")
    @PreAuthorize("hasAnyRole('TransportManager','SystemAdministrator')")
    public ResponseEntity<?> assignableConsignments(@RequestParam(required = false) String destination) {
        return ResponseEntity.ok(Map.of("consignments", allocationService.getAssignableConsignments(destination)));
    }
}
