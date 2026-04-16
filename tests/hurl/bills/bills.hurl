# ── Setup: login as BranchOperator and create a consignment ──────────────────

POST http://localhost:8080/api/auth/login
Content-Type: application/json
{
  "username": "operator1",
  "password": "password123"
}

HTTP 200
[Captures]
token: jsonpath "$.token"


POST http://localhost:8080/api/consignments
Authorization: Bearer {{token}}
Content-Type: application/json
{
  "volume": 30.0,
  "destination": "Chennai",
  "senderAddress": "Hurl Sender, Delhi",
  "receiverAddress": "Hurl Receiver, Chennai"
}

HTTP 201
[Captures]
consignment_number: jsonpath "$.consignment.consignment_number"


# ── 1. GET bill for consignment ───────────────────────────────────────────────

GET http://localhost:8080/api/bills/{{consignment_number}}
Authorization: Bearer {{token}}

HTTP 200
[Asserts]
jsonpath "$.bill.consignment_number" == {{consignment_number}}
jsonpath "$.bill.transport_charges" exists
jsonpath "$.consignment.destination" == "Chennai"


# ── 2. GET bill for non-existent consignment → 404 ───────────────────────────

GET http://localhost:8080/api/bills/TCCS-NONEXISTENT-0000
Authorization: Bearer {{token}}

HTTP 404


# ── 3. POST generate bill for existing consignment ───────────────────────────

POST http://localhost:8080/api/bills/generate
Authorization: Bearer {{token}}
Content-Type: application/json
{
  "consignmentNumber": "{{consignment_number}}"
}

HTTP 201
[Asserts]
jsonpath "$.bill.consignment_number" == {{consignment_number}}
jsonpath "$.finalCharge" exists


# ── 4. POST generate bill with missing consignmentNumber → 400 ───────────────

POST http://localhost:8080/api/bills/generate
Authorization: Bearer {{token}}
Content-Type: application/json
{}

HTTP 400
[Asserts]
jsonpath "$.error" == "consignmentNumber is required"
