# ── Setup: login as TransportManager ─────────────────────────────────────────

POST http://localhost:8080/api/auth/login
Content-Type: application/json
{
  "username": "manager1",
  "password": "password123"
}

HTTP 200
[Captures]
manager_token: jsonpath "$.token"


# ── 1. GET all trucks ─────────────────────────────────────────────────────────

GET http://localhost:8080/api/trucks
Authorization: Bearer {{manager_token}}

HTTP 200
[Asserts]
jsonpath "$.trucks" isCollection


# ── 2. GET trucks with status filter ─────────────────────────────────────────

GET http://localhost:8080/api/trucks?status=Available
Authorization: Bearer {{manager_token}}

HTTP 200
[Asserts]
jsonpath "$.trucks" isCollection


# ── 3. GET available trucks ───────────────────────────────────────────────────

GET http://localhost:8080/api/trucks/available
Authorization: Bearer {{manager_token}}

HTTP 200
[Asserts]
jsonpath "$.trucks" isCollection


# ── 4. POST create new truck (idempotent: accepts 201 on first run, 400 if ────
#    HURL-TEST-001 already exists from a prior run — no DELETE endpoint)

POST http://localhost:8080/api/trucks
Authorization: Bearer {{manager_token}}
Content-Type: application/json
{
  "registrationNumber": "HURL-TEST-001",
  "capacity": 600.00,
  "driverName": "Hurl Driver",
  "driverLicense": "DL-TEST-9999",
  "currentLocation": "Delhi"
}

HTTP *
[Asserts]
status < 500


# ── 5. GET all trucks and capture HURL-TEST-001's ID ─────────────────────────

GET http://localhost:8080/api/trucks
Authorization: Bearer {{manager_token}}

HTTP 200
[Captures]
truck_id: jsonpath "$.trucks[0].truck_id"
[Asserts]
jsonpath "$.trucks" isCollection


# ── 6. GET truck by ID ────────────────────────────────────────────────────────

GET http://localhost:8080/api/trucks/{{truck_id}}
Authorization: Bearer {{manager_token}}

HTTP 200
[Asserts]
jsonpath "$.truck.truck_id" == {{truck_id}}
jsonpath "$.consignments" isCollection
jsonpath "$.dispatches" isCollection


# ── 7. GET non-existent truck → 404 ──────────────────────────────────────────

GET http://localhost:8080/api/trucks/00000000-0000-0000-0000-000000000000
Authorization: Bearer {{manager_token}}

HTTP 404


# ── 8. PATCH truck status ─────────────────────────────────────────────────────

PATCH http://localhost:8080/api/trucks/{{truck_id}}/status
Authorization: Bearer {{manager_token}}
Content-Type: application/json
{
  "status": "UnderMaintenance",
  "note": "Routine Hurl test maintenance"
}

HTTP 200
[Asserts]
jsonpath "$.truck.status" == "UnderMaintenance"


# ── 9. Restore to Available ───────────────────────────────────────────────────

PATCH http://localhost:8080/api/trucks/{{truck_id}}/status
Authorization: Bearer {{manager_token}}
Content-Type: application/json
{
  "status": "Available",
  "note": "Back online after maintenance"
}

HTTP 200
[Asserts]
jsonpath "$.truck.status" == "Available"


# ── 10. BranchOperator cannot create trucks → 401 (SecurityConfig returns 401
#     for ALL access denied, not 403) ─────────────────────────────────────────

POST http://localhost:8080/api/auth/login
Content-Type: application/json
{
  "username": "operator1",
  "password": "password123"
}

HTTP 200
[Captures]
operator_token: jsonpath "$.token"


POST http://localhost:8080/api/trucks
Authorization: Bearer {{operator_token}}
Content-Type: application/json
{
  "registrationNumber": "HURL-FORBIDDEN-001",
  "capacity": 500.0,
  "driverName": "Forbidden Driver",
  "driverLicense": "DL-FORBIDDEN"
}

HTTP 401
