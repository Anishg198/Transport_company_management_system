package com.tccs.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tccs.model.Consignment;
import com.tccs.model.Truck;
import com.tccs.repository.ConsignmentRepository;
import com.tccs.repository.TruckRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.*;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AllocationService {

    private final ConsignmentRepository consignmentRepository;
    private final TruckRepository truckRepository;
    private final ObjectMapper objectMapper;

    @Value("${tccs.allocation.threshold}")
    private double allocationThreshold;

    public record AllocationResult(
            boolean triggered, String reason, BigDecimal totalVolume,
            Map<String, Object> truckInfo, String destination,
            int consignmentCount, List<String> consignments, boolean noTrucks
    ) {}

    @Transactional
    public AllocationResult checkAndTriggerAllocation(String destination) {
        BigDecimal totalVolume = consignmentRepository.sumPendingVolumeByDestination(destination);
        double threshold = allocationThreshold;

        if (totalVolume.doubleValue() < threshold) {
            // Mark registered ones as pending
            List<Consignment> registeredOnes = consignmentRepository.findByDestinationAndStatusIn(
                    destination, List.of(Consignment.ConsignmentStatus.Registered));
            for (Consignment c : registeredOnes) {
                appendStatusLog(c, c.getStatus(), Consignment.ConsignmentStatus.Pending,
                        String.format("Awaiting volume threshold (%.2fm³ / %.0fm³)",
                                totalVolume.doubleValue(), threshold));
                c.setStatus(Consignment.ConsignmentStatus.Pending);
                consignmentRepository.save(c);
            }
            return new AllocationResult(false,
                    String.format("Volume %.2fm³ < %.0fm³ threshold", totalVolume.doubleValue(), threshold),
                    totalVolume, null, destination, 0, null, false);
        }

        // Find suitable truck
        List<Truck> trucks = truckRepository.findAvailableTrucksWithCapacity(totalVolume);
        if (trucks.isEmpty()) {
            trucks = truckRepository.findAvailableTrucks();
        }
        if (trucks.isEmpty()) {
            return new AllocationResult(false, "No available trucks", totalVolume,
                    null, destination, 0, null, true);
        }

        Truck truck = trucks.get(0);
        List<Consignment> pending = consignmentRepository.findByDestinationAndStatusIn(
                destination, List.of(Consignment.ConsignmentStatus.Registered,
                                     Consignment.ConsignmentStatus.Pending));

        String now = OffsetDateTime.now().toString();
        List<String> consignmentNumbers = new ArrayList<>();

        for (Consignment c : pending) {
            appendStatusLog(c, c.getStatus(), Consignment.ConsignmentStatus.AllocatedToTruck,
                    "Allocated to truck " + truck.getRegistrationNumber());
            c.setStatus(Consignment.ConsignmentStatus.AllocatedToTruck);
            c.setAssignedTruckId(truck.getTruckId());
            consignmentRepository.save(c);
            consignmentNumbers.add(c.getConsignmentNumber());
        }

        // Update truck
        appendTruckStatusLog(truck, Truck.TruckStatus.Allocated,
                String.format("Allocated for %s with %d consignments (%.2fm³)",
                        destination, pending.size(), totalVolume.doubleValue()));
        truck.setStatus(Truck.TruckStatus.Allocated);
        truck.setDestination(destination);
        truck.setCargoVolume(totalVolume);
        truckRepository.save(truck);

        Map<String, Object> truckInfo = Map.of(
                "id", truck.getTruckId().toString(),
                "registrationNumber", truck.getRegistrationNumber(),
                "driverName", truck.getDriverName()
        );

        return new AllocationResult(true, "Allocation successful", totalVolume,
                truckInfo, destination, pending.size(), consignmentNumbers, false);
    }

    @Transactional
    public AllocationResult manualAssignToTruck(UUID truckId, List<String> consignmentIds) {
        Truck truck = truckRepository.findById(truckId)
                .orElseThrow(() -> new RuntimeException("Truck not found"));

        if (truck.getStatus() != Truck.TruckStatus.Available && truck.getStatus() != Truck.TruckStatus.Allocated) {
            throw new RuntimeException("Truck must be Available or Allocated to assign consignments (current: " + truck.getStatus() + ")");
        }

        List<Consignment> toAssign = consignmentRepository.findAllById(consignmentIds);
        if (toAssign.isEmpty()) throw new RuntimeException("No consignments found with provided IDs");

        BigDecimal addedVolume = BigDecimal.ZERO;
        List<String> numbers = new ArrayList<>();
        String destination = truck.getDestination();

        for (Consignment c : toAssign) {
            appendStatusLog(c, c.getStatus(), Consignment.ConsignmentStatus.AllocatedToTruck,
                    "Manually assigned to truck " + truck.getRegistrationNumber());
            c.setStatus(Consignment.ConsignmentStatus.AllocatedToTruck);
            c.setAssignedTruckId(truckId);
            consignmentRepository.save(c);
            addedVolume = addedVolume.add(c.getVolume());
            numbers.add(c.getConsignmentNumber());
            if (destination == null) destination = c.getDestination();
        }

        BigDecimal newVolume = (truck.getCargoVolume() != null ? truck.getCargoVolume() : BigDecimal.ZERO).add(addedVolume);
        appendTruckStatusLog(truck, Truck.TruckStatus.Allocated,
                String.format("Manually assigned %d consignments (%.2fm³ total load)", toAssign.size(), newVolume.doubleValue()));
        truck.setStatus(Truck.TruckStatus.Allocated);
        truck.setDestination(destination);
        truck.setCargoVolume(newVolume);
        truckRepository.save(truck);

        Map<String, Object> truckInfo = Map.of(
                "id", truck.getTruckId().toString(),
                "registrationNumber", truck.getRegistrationNumber(),
                "driverName", truck.getDriverName()
        );
        return new AllocationResult(true, "Manual assignment successful", newVolume,
                truckInfo, destination, toAssign.size(), numbers, false);
    }

    public List<Map<String, Object>> getAssignableConsignments(String destination) {
        List<Consignment.ConsignmentStatus> statuses = List.of(
                Consignment.ConsignmentStatus.Registered, Consignment.ConsignmentStatus.Pending);
        List<Consignment> list = destination != null && !destination.isBlank()
                ? consignmentRepository.findByDestinationAndStatusIn(destination, statuses)
                : consignmentRepository.findByStatusIn(statuses);
        return list.stream()
                .filter(c -> c.getAssignedTruckId() == null)
                .map(c -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("consignmentNumber", c.getConsignmentNumber());
                    m.put("destination", c.getDestination());
                    m.put("volume", c.getVolume());
                    m.put("status", c.getStatus().name());
                    m.put("senderAddress", c.getSenderAddress());
                    m.put("receiverAddress", c.getReceiverAddress());
                    m.put("transportCharges", c.getTransportCharges());
                    return m;
                }).collect(java.util.stream.Collectors.toList());
    }

    public List<Map<String, Object>> getPendingVolumes() {
        List<Object[]> rows = consignmentRepository.findPendingVolumesByDestination();
        List<Map<String, Object>> result = new ArrayList<>();
        for (Object[] row : rows) {
            String dest = (String) row[0];
            BigDecimal vol = (BigDecimal) row[1];
            long count = (long) row[2];
            double pct = vol.doubleValue() / allocationThreshold * 100;
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("destination", dest);
            item.put("pendingVolume", vol);
            item.put("consignmentCount", count);
            item.put("thresholdPercentage", Math.round(pct * 10.0) / 10.0);
            item.put("threshold", allocationThreshold);
            item.put("nearingThreshold", pct >= 80);
            result.add(item);
        }
        return result;
    }

    private void appendStatusLog(Consignment c, Consignment.ConsignmentStatus oldStatus,
                                  Consignment.ConsignmentStatus newStatus, String note) {
        try {
            List<Map<String, Object>> log = objectMapper.readValue(
                    c.getStatusChangeLog() != null ? c.getStatusChangeLog() : "[]",
                    objectMapper.getTypeFactory().constructCollectionType(List.class, Map.class));
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("oldStatus", oldStatus != null ? oldStatus.name() : null);
            entry.put("newStatus", newStatus.name());
            entry.put("timestamp", OffsetDateTime.now().toString());
            entry.put("note", note);
            log.add(entry);
            c.setStatusChangeLog(objectMapper.writeValueAsString(log));
        } catch (Exception ignored) {}
    }

    private void appendTruckStatusLog(Truck truck, Truck.TruckStatus newStatus, String note) {
        try {
            List<Map<String, Object>> log = objectMapper.readValue(
                    truck.getStatusHistory() != null ? truck.getStatusHistory() : "[]",
                    objectMapper.getTypeFactory().constructCollectionType(List.class, Map.class));
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("status", newStatus.name());
            entry.put("timestamp", OffsetDateTime.now().toString());
            entry.put("note", note);
            log.add(entry);
            truck.setStatusHistory(objectMapper.writeValueAsString(log));
        } catch (Exception ignored) {}
    }
}
