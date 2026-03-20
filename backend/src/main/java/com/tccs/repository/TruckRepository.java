package com.tccs.repository;

import com.tccs.model.Truck;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TruckRepository extends JpaRepository<Truck, UUID> {
    List<Truck> findByStatus(Truck.TruckStatus status);
    List<Truck> findByStatusOrderByCapacityDesc(Truck.TruckStatus status);
    boolean existsByRegistrationNumber(String registrationNumber);

    @Query("SELECT t FROM Truck t WHERE t.status = 'Available' ORDER BY t.capacity ASC")
    List<Truck> findAvailableTrucks();

    @Query("SELECT t FROM Truck t WHERE t.status = 'Available' AND t.capacity >= :minCapacity ORDER BY t.capacity ASC")
    List<Truck> findAvailableTrucksWithCapacity(java.math.BigDecimal minCapacity);
}
