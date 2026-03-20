package com.tccs.repository;

import com.tccs.model.Consignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface ConsignmentRepository extends JpaRepository<Consignment, String> {

    List<Consignment> findByStatusIn(List<Consignment.ConsignmentStatus> statuses);

    List<Consignment> findByDestinationAndStatusIn(String destination, List<Consignment.ConsignmentStatus> statuses);

    List<Consignment> findByAssignedTruckId(UUID truckId);

    @Query("SELECT COALESCE(SUM(c.volume), 0) FROM Consignment c " +
           "WHERE c.destination = :destination AND c.status IN ('Registered','Pending')")
    BigDecimal sumPendingVolumeByDestination(@Param("destination") String destination);

    @Query("SELECT c.destination, COALESCE(SUM(c.volume),0), COUNT(c) " +
           "FROM Consignment c WHERE c.status IN ('Registered','Pending') " +
           "GROUP BY c.destination ORDER BY SUM(c.volume) DESC")
    List<Object[]> findPendingVolumesByDestination();

    @Query("SELECT COUNT(c) FROM Consignment c WHERE c.registrationTimestamp >= :start")
    long countTodaysConsignments(@Param("start") OffsetDateTime start);

    @Query("SELECT COUNT(c) FROM Consignment c WHERE c.status = :status")
    long countByStatus(@Param("status") Consignment.ConsignmentStatus status);

    @Query("SELECT COALESCE(SUM(c.transportCharges),0) FROM Consignment c " +
           "WHERE c.registrationTimestamp >= :start AND c.status <> 'Cancelled'")
    BigDecimal sumTodaysRevenue(@Param("start") OffsetDateTime start);
}
