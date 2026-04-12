# TCCS Backend Test Suite Documentation

This document provides an overview of the JUnit 5 test suite implemented for the TCCS (Transport & Consignment Control System) Spring Boot backend.

## 🛠 Testing Stack
- **Framework:** JUnit 5 (Jupiter)
- **Mocking:** Mockito
- **Web Layer:** MockMvc
- **Assertions:** AssertJ
- **Security:** Spring Security Test (`@WithMockUser`, `csrf()`, `authentication()`)

## 🏗 Test Architecture
The test suite follows a **Layer Isolation** strategy using `@WebMvcTest`. 
- **AbstractControllerTest:** A base class that configures the security context, mocks the `JwtAuthFilter`, `JwtUtil`, and `UserRepository`, and provides common setup for all controller tests.
- **Service/Repository Mocking:** All dependencies are mocked using `@MockBean` to ensure tests only validate the Web (Controller) layer logic.

## 📋 Test Suites Overview

### 1. AllocationControllerTest
- **trigger:** Validates manual allocation of pending consignments to trucks for a specific destination. Verified RBAC (TransportManager/Admin only).
- **pendingVolumes:** Ensures the report of pending volumes per destination is correctly returned.

### 2. AuthControllerTest
- **login:** Tests successful JWT token generation and last-login tracking.
- **register:** Validates user registration workflow and duplicate username checks.
- **me:** Verifies retrieval of the currently authenticated user's profile.

### 3. BillControllerTest
- **getByConsignment:** Tests retrieval of the latest bill for a specific consignment.
- **generate:** Validates the manual bill generation process using `BillService`.

### 4. ChatControllerTest
- **getChatUsers:** Verifies that authenticated users can retrieve a list of active users for messaging.
- **sendMessage:** Tests the creation and storage of chat messages linked to specific consignments.

### 5. ConsignmentControllerTest
- **getAll/getById:** Validates retrieval of consignment records.
- **create:** Tests the registration process, including automatic bill generation and allocation checks.
- **updateStatus:** Verifies the patching of consignment statuses (e.g., Registered -> Pending).
- **delete:** Rigorously tests RBAC (SystemAdministrator only).

### 6. DashboardControllerTest
- **summary:** Validates the aggregation of daily counts, revenue, and pending volumes for the dashboard.
- **health:** Verifies the dashboard-specific health check.

### 7. DispatchControllerTest
- **getAll:** Tests retrieval of dispatch history ordered by timestamp.
- **create:** Validates the creation of dispatch documents (e.g., failing when no consignments are allocated).

### 8. HealthControllerTest
- **health:** Validates the public API status endpoint.

### 9. PricingControllerTest
- **getAll:** Verifies retrieval of active pricing rules.
- **create/update:** Tests the management of destination-based pricing rates. Restricted to `SystemAdministrator`.

### 10. ReportControllerTest
- **revenue:** Tests complex native query results for revenue by destination and daily summaries.
- **performance:** Validates truck and driver performance reporting logic.

### 11. TruckControllerTest
- **getAll:** Verifies retrieval of the truck fleet.
- **create:** Tests the addition of new trucks with registration number uniqueness checks.
- **updateStatus:** Validates truck status transitions (e.g., Available -> UnderMaintenance).

### 12. UserControllerTest
- **getAll:** Validates administrative user list retrieval.
- **create:** Tests administrative user creation with specific roles.
- **approve:** Verifies the user approval workflow (Pending -> Approved).

## 🚀 Running Tests
To execute the full test suite, run the following command in the project root:
```bash
mvn test
```
