package com.tccs.controller;

import com.tccs.model.Consignment;
import com.tccs.model.Truck;
import com.tccs.repository.ConsignmentRepository;
import com.tccs.repository.TruckRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final ConsignmentRepository consignmentRepository;
    private final TruckRepository truckRepository;

    @GetMapping("/summary")
    public ResponseEntity<?> summary() {
        OffsetDateTime startOfDay = OffsetDateTime.now(ZoneOffset.UTC).toLocalDate()
                .atStartOfDay().atOffset(ZoneOffset.UTC);

        long todayCount = consignmentRepository.countTodaysConsignments(startOfDay);
        long pendingCount = consignmentRepository.countByStatus(Consignment.ConsignmentStatus.Pending);
        long inTransitCount = consignmentRepository.countByStatus(Consignment.ConsignmentStatus.InTransit);
        long registeredToday = consignmentRepository.countTodaysConsignments(startOfDay);

        long deliveredToday = consignmentRepository.findAll().stream()
                .filter(c -> c.getStatus() == Consignment.ConsignmentStatus.Delivered
                        && c.getUpdatedAt() != null && c.getUpdatedAt().isAfter(startOfDay))
                .count();

        var todayRevenue = consignmentRepository.sumTodaysRevenue(startOfDay);

        Map<String, Object> consStats = new LinkedHashMap<>();
        consStats.put("today_count", todayCount);
        consStats.put("pending_count", pendingCount);
        consStats.put("in_transit_count", inTransitCount);
        consStats.put("delivered_today", deliveredToday);
        consStats.put("registered_today", registeredToday);
        consStats.put("today_revenue", todayRevenue);

        List<Truck> trucks = truckRepository.findAll();
        Map<String, Object> truckStats = new LinkedHashMap<>();
        truckStats.put("available", trucks.stream().filter(t -> t.getStatus() == Truck.TruckStatus.Available).count());
        truckStats.put("in_transit", trucks.stream().filter(t -> t.getStatus() == Truck.TruckStatus.InTransit).count());
        truckStats.put("allocated", trucks.stream().filter(t -> t.getStatus() == Truck.TruckStatus.Allocated).count());
        truckStats.put("loading", trucks.stream().filter(t -> t.getStatus() == Truck.TruckStatus.Loading).count());
        truckStats.put("under_maintenance", trucks.stream().filter(t -> t.getStatus() == Truck.TruckStatus.UnderMaintenance).count());
        truckStats.put("total", trucks.size());

        // Pending volumes
        List<Object[]> pendingVols = consignmentRepository.findPendingVolumesByDestination();
        var pendingVolsList = pendingVols.stream().map(row -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("destination", row[0]);
            m.put("pending_volume", row[1]);
            m.put("count", row[2]);
            return m;
        }).toList();

        return ResponseEntity.ok(Map.of(
                "consignments", consStats,
                "trucks", truckStats,
                "pendingVolumes", pendingVolsList
        ));
    }

    @GetMapping("/health")
    public ResponseEntity<?> health() {
        return ResponseEntity.ok(Map.of("status", "ok", "service", "TCCS Java API",
                "timestamp", OffsetDateTime.now().toString()));
    }
}
