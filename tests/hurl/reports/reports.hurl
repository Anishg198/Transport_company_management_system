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


# ── 1. GET revenue report ─────────────────────────────────────────────────────
# Response: { summary: {total_revenue, total_consignments, avg_charge, total_volume},
#             revenueByDestination: [...], dailyRevenue: [...], dateRange: {...} }

GET http://localhost:8080/api/reports/revenue
Authorization: Bearer {{manager_token}}

HTTP 200
[Asserts]
jsonpath "$.summary" exists
jsonpath "$.summary.total_revenue" isFloat
jsonpath "$.summary.total_consignments" isInteger
jsonpath "$.revenueByDestination" isCollection
jsonpath "$.dailyRevenue" isCollection


# ── 2. GET revenue with date range ───────────────────────────────────────────

GET http://localhost:8080/api/reports/revenue?startDate=2026-01-01&endDate=2026-12-31
Authorization: Bearer {{manager_token}}

HTTP 200
[Asserts]
jsonpath "$.summary" exists


# ── 3. GET performance report ─────────────────────────────────────────────────

GET http://localhost:8080/api/reports/performance
Authorization: Bearer {{manager_token}}

HTTP 200


# ── 4. GET truck-usage report ─────────────────────────────────────────────────

GET http://localhost:8080/api/reports/truck-usage
Authorization: Bearer {{manager_token}}

HTTP 200


# ── 5. GET Excel export ───────────────────────────────────────────────────────

GET http://localhost:8080/api/reports/export/excel
Authorization: Bearer {{manager_token}}

HTTP 200
[Asserts]
header "Content-Type" contains "spreadsheetml"


# ── 6. GET PDF export ─────────────────────────────────────────────────────────

GET http://localhost:8080/api/reports/export/pdf
Authorization: Bearer {{manager_token}}

HTTP 200
[Asserts]
header "Content-Type" contains "pdf"


# ── 7. BranchOperator cannot access reports → 403 ────────────────────────────

POST http://localhost:8080/api/auth/login
Content-Type: application/json
{
  "username": "operator1",
  "password": "password123"
}

HTTP 200
[Captures]
operator_token: jsonpath "$.token"


GET http://localhost:8080/api/reports/revenue
Authorization: Bearer {{operator_token}}

HTTP 401
