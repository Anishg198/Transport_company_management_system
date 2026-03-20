package com.tccs.repository;

import com.tccs.model.Bill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface BillRepository extends JpaRepository<Bill, UUID> {
    Optional<Bill> findFirstByConsignmentNumberOrderByCreatedAtDesc(String consignmentNumber);
}
