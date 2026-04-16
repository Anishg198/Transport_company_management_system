# ── Setup: login ─────────────────────────────────────────────────────────────

POST http://localhost:8080/api/auth/login
Content-Type: application/json
{
  "username": "admin1",
  "password": "admin123"
}

HTTP 200
[Captures]
token: jsonpath "$.token"


# ── 1. GET dashboard summary ──────────────────────────────────────────────────
# Response: { consignments: {...}, trucks: {...}, pendingVolumes: [...] }

GET http://localhost:8080/api/dashboard/summary
Authorization: Bearer {{token}}

HTTP 200
[Asserts]
jsonpath "$.consignments" exists
jsonpath "$.trucks" exists
jsonpath "$.trucks.total" isInteger
jsonpath "$.consignments.today_count" isInteger
jsonpath "$.consignments.pending_count" isInteger
jsonpath "$.pendingVolumes" isCollection


# ── 2. GET dashboard health ───────────────────────────────────────────────────

GET http://localhost:8080/api/dashboard/health
Authorization: Bearer {{token}}

HTTP 200


# ── 3. Unauthenticated access → 401 ──────────────────────────────────────────

GET http://localhost:8080/api/dashboard/summary

HTTP 401
