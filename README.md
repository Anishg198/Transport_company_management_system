# Transport Company Computerisation System (TCCS)

A full-stack web application for managing transport operations — consignments, fleet, dispatches, billing, and user administration.

---

## Tech Stack

| Layer     | Technology                                      |
|-----------|-------------------------------------------------|
| Backend   | Java 17, Spring Boot 3.2, Spring Security (JWT) |
| Database  | PostgreSQL                                      |
| Frontend  | React 18, Vite, TailwindCSS, Recharts           |
| Auth      | JWT tokens, role-based access control           |

---

## Features

### Roles
| Role | Capabilities |
|------|-------------|
| **Branch Operator** | Register consignments, generate transport bills |
| **Transport Manager** | Manage fleet, allocate & dispatch trucks |
| **System Administrator** | Full access + user management & approvals |

### Core Modules
- **Consignments** — Register, track status, view history
- **Fleet Management** — Add trucks, monitor capacity, manual consignment assignment
- **Allocation Engine** — Auto-allocates trucks when pending volume exceeds 500 m³ threshold
- **Dispatch** — Create dispatch documents, track deliveries
- **Billing** — Auto-generated transport bills with pricing tiers
- **Reports** — Volume, revenue, and route analytics with charts
- **User Management** — Admin approval workflow for new registrations

---

## Getting Started

### Prerequisites
- Java 17+
- Node.js 18+
- PostgreSQL 14+

### Database Setup
```sql
CREATE DATABASE tccs_db;
```

### Backend
```bash
cd backend
# Edit src/main/resources/application.yml with your DB credentials
./mvnw spring-boot:run
```
Runs on **http://localhost:8080**

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Runs on **http://localhost:5173**

---

## Configuration

`backend/src/main/resources/application.yml`:
```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/tccs_db
    username: your_username
    password: your_password

tccs:
  jwt:
    secret: your-jwt-secret
  allocation:
    threshold: 500   # m³ before auto-allocation triggers
```

---

## API Overview

| Endpoint | Description |
|----------|-------------|
| `POST /api/auth/login` | Login, returns JWT |
| `POST /api/auth/register` | Public registration (pending approval) |
| `GET /api/consignments` | List consignments |
| `POST /api/consignments` | Register new consignment |
| `GET /api/trucks` | List fleet |
| `POST /api/allocation/trigger` | Trigger auto-allocation |
| `POST /api/allocation/manual-assign` | Manually assign consignments to truck |
| `GET /api/dispatches` | List dispatches |
| `POST /api/dispatches` | Create dispatch document |
| `GET /api/bills` | List transport bills |
| `GET /api/users` | List users (admin only) |
| `PATCH /api/users/{id}/approve` | Approve pending user |
| `PATCH /api/users/{id}/reject` | Reject pending user |

---

## User Registration Flow

1. New user submits registration at `/register`
2. Account is created with `PENDING` status (cannot log in yet)
3. System Administrator reviews under **Users → Pending Approvals**
4. Admin approves or rejects — user is notified on next login attempt

---

## Project Structure

```
├── backend/
│   └── src/main/java/com/tccs/
│       ├── controller/      # REST endpoints
│       ├── service/         # Business logic
│       ├── model/           # JPA entities
│       ├── repository/      # Spring Data repos
│       ├── security/        # JWT + Spring Security
│       └── config/          # App configuration
└── frontend/
    └── src/
        ├── pages/           # Route-level components
        ├── components/      # Shared UI components
        ├── services/        # API client (api.js)
        └── contexts/        # Auth context
```

---

## Demo Credentials

| Role | Username | Password |
|------|----------|----------|
| Branch Operator | `operator1` | `password123` |
| Transport Manager | `manager1` | `password123` |
| System Administrator | `admin1` | `admin123` |
