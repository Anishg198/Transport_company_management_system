# ── Setup: login as SystemAdmin ───────────────────────────────────────────────

POST http://localhost:8080/api/auth/login
Content-Type: application/json
{
  "username": "admin1",
  "password": "admin123"
}

HTTP 200
[Captures]
admin_token: jsonpath "$.token"


# ── 1. GET all pricing rules ──────────────────────────────────────────────────

GET http://localhost:8080/api/pricing-rules
Authorization: Bearer {{admin_token}}

HTTP 200
[Asserts]
jsonpath "$.pricingRules" isCollection


# ── 2. POST create pricing rule ───────────────────────────────────────────────
# PricingRule fields (camelCase from JPA): id, destination, ratePerCubicMeter,
# minimumCharge, effectiveDate, expiryDate, isActive, createdAt, updatedAt

POST http://localhost:8080/api/pricing-rules
Authorization: Bearer {{admin_token}}
Content-Type: application/json
{
  "destination": "Hyderabad",
  "ratePerCubicMeter": 12.50,
  "minimumCharge": 500.00,
  "effectiveDate": "2026-01-01"
}

HTTP 201
[Captures]
rule_id: jsonpath "$.pricingRule.id"
[Asserts]
jsonpath "$.pricingRule.destination" == "Hyderabad"
jsonpath "$.pricingRule.ratePerCubicMeter" == 12.5
jsonpath "$.pricingRule.isActive" == true


# ── 3. Non-admin cannot create pricing rule → 403 ────────────────────────────

POST http://localhost:8080/api/auth/login
Content-Type: application/json
{
  "username": "operator1",
  "password": "password123"
}

HTTP 200
[Captures]
operator_token: jsonpath "$.token"


POST http://localhost:8080/api/pricing-rules
Authorization: Bearer {{operator_token}}
Content-Type: application/json
{
  "destination": "Delhi",
  "ratePerCubicMeter": 10.0,
  "minimumCharge": 400.0,
  "effectiveDate": "2026-01-01"
}

HTTP 401


# ── 4. PUT update pricing rule ────────────────────────────────────────────────

PUT http://localhost:8080/api/pricing-rules/{{rule_id}}
Authorization: Bearer {{admin_token}}
Content-Type: application/json
{
  "ratePerCubicMeter": 14.00,
  "minimumCharge": 600.00,
  "isActive": true
}

HTTP 200
[Asserts]
jsonpath "$.pricingRule.ratePerCubicMeter" == 14.0
jsonpath "$.pricingRule.minimumCharge" == 600.0


# ── 5. PUT non-existent rule → 404 ───────────────────────────────────────────

PUT http://localhost:8080/api/pricing-rules/00000000-0000-0000-0000-000000000000
Authorization: Bearer {{admin_token}}
Content-Type: application/json
{
  "ratePerCubicMeter": 10.0
}

HTTP 404


# ── 6. Deactivate the rule ────────────────────────────────────────────────────

PUT http://localhost:8080/api/pricing-rules/{{rule_id}}
Authorization: Bearer {{admin_token}}
Content-Type: application/json
{
  "isActive": false
}

HTTP 200
[Asserts]
jsonpath "$.pricingRule.isActive" == false
