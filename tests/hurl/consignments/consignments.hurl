# ── Setup: login as BranchOperator ───────────────────────────────────────────

POST http://localhost:8080/api/auth/login
Content-Type: application/json
{
  "username": "operator1",
  "password": "password123"
}

HTTP 200
[Captures]
token: jsonpath "$.token"


# ── 1. GET all consignments ───────────────────────────────────────────────────

GET http://localhost:8080/api/consignments
Authorization: Bearer {{token}}

HTTP 200
[Asserts]
jsonpath "$.consignments" isCollection
jsonpath "$.total" isInteger


# ── 2. GET with status filter ─────────────────────────────────────────────────

GET http://localhost:8080/api/consignments?status=Registered
Authorization: Bearer {{token}}

HTTP 200
[Asserts]
jsonpath "$.consignments" isCollection


# ── 3. GET with search filter ─────────────────────────────────────────────────

GET http://localhost:8080/api/consignments?search=TCCS
Authorization: Bearer {{token}}

HTTP 200
[Asserts]
jsonpath "$.consignments" isCollection


# ── 4. POST create new consignment ───────────────────────────────────────────

POST http://localhost:8080/api/consignments
Authorization: Bearer {{token}}
Content-Type: application/json
{
  "volume": 25.50,
  "destination": "Mumbai",
  "senderAddress": "123 Sender Street, Delhi",
  "receiverAddress": "456 Receiver Road, Mumbai"
}

HTTP 201
[Captures]
consignment_number: jsonpath "$.consignment.consignment_number"
[Asserts]
jsonpath "$.consignment.consignment_number" exists
jsonpath "$.consignment.destination" == "Mumbai"
jsonpath "$.consignment.status" exists
jsonpath "$.allocationTriggered" isBoolean


# ── 5. POST create with missing fields → 400 ─────────────────────────────────

POST http://localhost:8080/api/consignments
Authorization: Bearer {{token}}
Content-Type: application/json
{
  "volume": 10.0,
  "destination": "Delhi"
}

HTTP 400
[Asserts]
jsonpath "$.error" exists


# ── 6. GET consignment by ID ──────────────────────────────────────────────────

GET http://localhost:8080/api/consignments/{{consignment_number}}
Authorization: Bearer {{token}}

HTTP 200
[Asserts]
jsonpath "$.consignment.consignment_number" == {{consignment_number}}
jsonpath "$.consignment.destination" == "Mumbai"


# ── 7. GET non-existent consignment → 404 ────────────────────────────────────

GET http://localhost:8080/api/consignments/TCCS-DOESNOTEXIST
Authorization: Bearer {{token}}

HTTP 404


# ── 8. PATCH update status ────────────────────────────────────────────────────

PATCH http://localhost:8080/api/consignments/{{consignment_number}}/status
Authorization: Bearer {{token}}
Content-Type: application/json
{
  "status": "Pending",
  "note": "Hurl test status update"
}

HTTP 200
[Asserts]
jsonpath "$.consignment.status" == "Pending"


# ── 9. Login as admin, then DELETE ───────────────────────────────────────────

POST http://localhost:8080/api/auth/login
Content-Type: application/json
{
  "username": "admin1",
  "password": "admin123"
}

HTTP 200
[Captures]
admin_token: jsonpath "$.token"


DELETE http://localhost:8080/api/consignments/{{consignment_number}}
Authorization: Bearer {{admin_token}}

HTTP 200
[Asserts]
jsonpath "$.message" exists


# ── 10. BranchOperator cannot delete → 403 ───────────────────────────────────

POST http://localhost:8080/api/consignments
Authorization: Bearer {{token}}
Content-Type: application/json
{
  "volume": 5.0,
  "destination": "Delhi",
  "senderAddress": "Sender, Delhi",
  "receiverAddress": "Receiver, Delhi"
}

HTTP 201
[Captures]
no_delete_number: jsonpath "$.consignment.consignment_number"


DELETE http://localhost:8080/api/consignments/{{no_delete_number}}
Authorization: Bearer {{token}}

HTTP 401
