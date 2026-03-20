package com.tccs.repository;

import com.tccs.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByUsernameAndIsActiveTrue(String username);
    Optional<User> findByUsername(String username);
    Optional<User> findByUserIdAndIsActiveTrue(UUID userId);
    boolean existsByUsername(String username);
    List<User> findByApprovalStatus(String approvalStatus);
}
