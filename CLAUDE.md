# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**TCCS** (Transport and Consignment Control System) is a full-stack enterprise transport management system for tracking consignments, automating truck allocation, and managing billing.

## Development Commands

### Backend (Spring Boot, port 8080)
```bash
cd backend
./mvnw spring-boot:run          # Start dev server
./mvnw test                     # Run all tests
./mvnw package -DskipTests      # Build JAR
```

### Frontend (React + Vite, port 5173)
```bash
cd frontend
npm install
npm run dev       # Start dev server
npm run build     # Production build
npm run preview   # Preview production build
```

### Database
```sql
CREATE DATABASE tccs_db;
-- Hibernate auto-creates/updates schema via JPA entities (ddl-auto: update)
```

**Prerequisites:** Java 21, Node.js 18+, PostgreSQL 14+

## Architecture

### Backend (`backend/src/main/java/com/tccs/`)
Spring Boot MVC with layered architecture:
- `controller/` — 11 REST controllers (auth, consignments, trucks, allocation, dispatch, bills, reports, users, pricing, dashboard, health)
- `service/` — Business logic; key services: `AllocationService` (auto-allocates trucks when pending volume ≥ 500 m³), `BillService` (calculates charges via pricing rules)
- `model/` — 6 JPA entities: `User`, `Consignment`, `Truck`, `DispatchDocument`, `Bill`, `PricingRule`
- `repository/` — Spring Data JPA repos for each entity
- `security/` — JWT auth filter + token provider (8-hour expiration)
- `config/` — Security config (stateless, CORS for port 5173, CSRF disabled), app config

### Frontend (`frontend/src/`)
React 18 SPA with React Router 6:
- `pages/` — Route-level components (dashboard, consignments, fleet, dispatch, bills, reports, pricing, users, settings, login/register)
- `components/` — Reusable UI; layout includes Header + Sidebar
- `services/api.js` — Axios client with JWT interceptor (auto-attaches Bearer token, auto-logout on 401)
- `contexts/` — `AuthContext` stores JWT token + user role in localStorage
- Styling: TailwindCSS with custom glassmorphic design (navy/electric/amber/cyan/violet palette)

### Key Business Flows

1. **Auto-Allocation:** BranchOperator registers consignment → when total pending volume ≥ 500 m³, `AllocationService` automatically assigns an available truck → status progresses: `Registered → Pending → AllocatedToTruck → InTransit → Delivered`

2. **Billing:** Auto-generated on truck allocation; calculated from `PricingRule` volume tiers

3. **User Approval:** New registrations start as `PENDING` (cannot log in) → `SystemAdmin` approves/rejects via `/users` page

4. **Export:** Reports page exports to Excel (Apache POI) or PDF (iText)

### Auth Flow
Login → POST `/api/auth/login` → JWT stored in localStorage → attached as `Authorization: Bearer <token>` on all API requests → 30-minute inactivity timeout client-side, 8-hour server-side expiry

### Role-Based Access
| Role | Key Permissions |
|------|----------------|
| `BranchOperator` | Register consignments |
| `TransportManager` | Fleet management, reports |
| `SystemAdmin` | User approvals, pricing rules, full access |

## Configuration

Backend config: `backend/src/main/resources/application.yml`
- DB: PostgreSQL on `localhost:5432/tccs_db`
- Allocation threshold: `500` m³ (configurable)
- CORS origin: `http://localhost:5173`

Frontend API proxy: Vite proxies `/api/*` → `http://localhost:8080` in dev

## Demo Credentials
- BranchOperator: `operator1`
- TransportManager: `manager1`
- SystemAdmin: `admin1`
