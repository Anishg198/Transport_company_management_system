package com.tccs.repository;

import com.tccs.model.DispatchDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DispatchDocumentRepository extends JpaRepository<DispatchDocument, UUID> {
    List<DispatchDocument> findByTruckId(UUID truckId);
    List<DispatchDocument> findByDispatchStatus(DispatchDocument.DispatchStatus status);
    List<DispatchDocument> findAllByOrderByDispatchTimestampDesc();
}
