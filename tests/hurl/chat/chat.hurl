# ── Setup: login as BranchOperator ───────────────────────────────────────────

POST http://localhost:8080/api/auth/login
Content-Type: application/json
{
  "username": "operator1",
  "password": "password123"
}

HTTP 200
[Captures]
operator_token: jsonpath "$.token"


# ── 1. GET chat users (operator sees managers and admins) ────────────────────

GET http://localhost:8080/api/chat/users
Authorization: Bearer {{operator_token}}

HTTP 200
[Captures]
recipient_id: jsonpath "$.users[0].user_id"
[Asserts]
jsonpath "$.users" isCollection


# ── 2. POST send a message ────────────────────────────────────────────────────

POST http://localhost:8080/api/chat/messages
Authorization: Bearer {{operator_token}}
Content-Type: application/json
{
  "content": "Hello from Hurl test",
  "recipientId": "{{recipient_id}}"
}

HTTP 201
[Captures]
message_sent_at: jsonpath "$.sent_at"
[Asserts]
jsonpath "$.content" == "Hello from Hurl test"
jsonpath "$.sender_role" == "BranchOperator"
jsonpath "$.message_id" exists


# ── 3. POST send message with consignment reference ───────────────────────────

POST http://localhost:8080/api/chat/messages
Authorization: Bearer {{operator_token}}
Content-Type: application/json
{
  "content": "Check this consignment please",
  "recipientId": "{{recipient_id}}",
  "consignmentRef": "TCCS-20260101-0001"
}

HTTP 201
[Asserts]
jsonpath "$.content" == "Check this consignment please"
jsonpath "$.consignment_ref" == "TCCS-20260101-0001"


# ── 4. POST message with missing content → 400 ───────────────────────────────

POST http://localhost:8080/api/chat/messages
Authorization: Bearer {{operator_token}}
Content-Type: application/json
{
  "recipientId": "{{recipient_id}}"
}

HTTP 400
[Asserts]
jsonpath "$.error" == "content is required"


# ── 5. POST message with missing recipientId → 400 ───────────────────────────

POST http://localhost:8080/api/chat/messages
Authorization: Bearer {{operator_token}}
Content-Type: application/json
{
  "content": "No recipient"
}

HTTP 400
[Asserts]
jsonpath "$.error" == "recipientId is required"


# ── 6. GET messages in conversation ───────────────────────────────────────────

GET http://localhost:8080/api/chat/messages?with={{recipient_id}}
Authorization: Bearer {{operator_token}}

HTTP 200
[Asserts]
jsonpath "$.messages" isCollection


# ── 7. GET messages since a timestamp ────────────────────────────────────────

GET http://localhost:8080/api/chat/messages?with={{recipient_id}}&since=2026-01-01T00:00:00Z
Authorization: Bearer {{operator_token}}

HTTP 200
[Asserts]
jsonpath "$.messages" isCollection


# ── 8. GET messages without auth → 401 ───────────────────────────────────────

GET http://localhost:8080/api/chat/users

HTTP 401
