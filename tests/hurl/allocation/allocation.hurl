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


# ── 1. GET pending volumes ────────────────────────────────────────────────────

GET http://localhost:8080/api/allocation/pending-volumes
Authorization: Bearer {{manager_token}}

HTTP 200
[Asserts]
jsonpath "$.pendingVolumes" exists


# ── 2. GET assignable consignments ───────────────────────────────────────────

GET http://localhost:8080/api/allocation/assignable-consignments
Authorization: Bearer {{manager_token}}

HTTP 200
[Asserts]
jsonpath "$.consignments" isCollection


# ── 3. GET assignable consignments by destination ────────────────────────────

GET http://localhost:8080/api/allocation/assignable-consignments?destination=Mumbai
Authorization: Bearer {{manager_token}}

HTTP 200
[Asserts]
jsonpath "$.consignments" isCollection


# ── 4. POST trigger allocation ───────────────────────────────────────────────

POST http://localhost:8080/api/allocation/trigger
Authorization: Bearer {{manager_token}}
Content-Type: application/json
{
  "destination": "Mumbai"
}

HTTP 200
[Asserts]
jsonpath "$.triggered" isBoolean
jsonpath "$.reason" exists
jsonpath "$.destination" == "Mumbai"


# ── 5. POST trigger with missing destination → 400 ───────────────────────────

POST http://localhost:8080/api/allocation/trigger
Authorization: Bearer {{manager_token}}
Content-Type: application/json
{}

HTTP 400
[Asserts]
jsonpath "$.error" == "destination is required"


# ── 6. POST manual-assign with missing truckId → 400 ────────────────────────

POST http://localhost:8080/api/allocation/manual-assign
Authorization: Bearer {{manager_token}}
Content-Type: application/json
{
  "consignmentIds": ["TCCS-20260101-0001"]
}

HTTP 400
[Asserts]
jsonpath "$.error" == "truckId required"


# ── 7. POST manual-assign with missing consignmentIds → 400 ─────────────────

POST http://localhost:8080/api/allocation/manual-assign
Authorization: Bearer {{manager_token}}
Content-Type: application/json
{
  "truckId": "00000000-0000-0000-0000-000000000000"
}

HTTP 400
[Asserts]
jsonpath "$.error" == "consignmentIds required"


# ── 8. BranchOperator cannot trigger allocation → 401 ────────────────────────

POST http://localhost:8080/api/auth/login
Content-Type: application/json
{
  "username": "operator1",
  "password": "password123"
}

HTTP 200
[Captures]
operator_token: jsonpath "$.token"


POST http://localhost:8080/api/allocation/trigger
Authorization: Bearer {{operator_token}}
Content-Type: application/json
{
  "destination": "Mumbai"
}

# Spring Security returns 401 when method-level @PreAuthorize blocks a lower-privileged role
HTTP 401


# ── 9. POST manual-assign success — full idempotent flow ─────────────────────
#    Strategy: create HURL-ALLOC-001 (idempotent HTTP *), then find the first
#    available truck (sorted by updatedAt DESC) — on first run it is HURL-ALLOC-001;
#    on re-runs it is whatever truck dispatch.hurl cleaned up last.
#    This leaves the truck in Allocated state for dispatch.hurl to consume.

POST http://localhost:8080/api/auth/login
Content-Type: application/json
{
  "username": "manager1",
  "password": "password123"
}

HTTP 200
[Captures]
manager_token2: jsonpath "$.token"


# Idempotent: 201 on first run, 400 if already exists — both are acceptable.
POST http://localhost:8080/api/trucks
Authorization: Bearer {{manager_token2}}
Content-Type: application/json
{
  "registrationNumber": "HURL-ALLOC-001",
  "capacity": 800.00,
  "driverName": "Alloc Test Driver",
  "driverLicense": "DL-ALLOC-001",
  "currentLocation": "Mumbai"
}

HTTP *
[Asserts]
status < 500


# Pick the first available truck (most recently updated = just created or reset by dispatch cleanup).
GET http://localhost:8080/api/trucks?status=Available
Authorization: Bearer {{manager_token2}}

HTTP 200
[Captures]
alloc_truck_id: jsonpath "$.trucks[0].truck_id"
[Asserts]
jsonpath "$.trucks" isCollection


POST http://localhost:8080/api/auth/login
Content-Type: application/json
{
  "username": "operator1",
  "password": "password123"
}

HTTP 200
[Captures]
alloc_operator_token: jsonpath "$.token"


POST http://localhost:8080/api/consignments
Authorization: Bearer {{alloc_operator_token}}
Content-Type: application/json
{
  "volume": 50.0,
  "destination": "AllocTestCity",
  "senderAddress": "Sender, Mumbai",
  "receiverAddress": "Receiver, AllocTestCity"
}

HTTP 201
[Captures]
alloc_consignment_id: jsonpath "$.consignment.consignment_number"


POST http://localhost:8080/api/allocation/manual-assign
Authorization: Bearer {{manager_token2}}
Content-Type: application/json
{
  "truckId": "{{alloc_truck_id}}",
  "consignmentIds": ["{{alloc_consignment_id}}"]
}

HTTP 200
[Asserts]
jsonpath "$.triggered" == true
jsonpath "$.consignmentCount" == 1
