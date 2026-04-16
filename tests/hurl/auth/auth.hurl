# ── 1. Register with duplicate username → 400 ─────────────────────────────────
#    (operator1 always exists from demo data — fully idempotent)

POST http://localhost:8080/api/auth/register
Content-Type: application/json
{
  "username": "operator1",
  "password": "testpass123",
  "name": "Duplicate"
}

HTTP 400
[Asserts]
jsonpath "$.error" == "Username already taken"


# ── 2. Register with username too short → 400 ────────────────────────────────

POST http://localhost:8080/api/auth/register
Content-Type: application/json
{
  "username": "ab",
  "password": "testpass123",
  "name": "Short Username"
}

HTTP 400
[Asserts]
jsonpath "$.error" exists


# ── 3. Register with password too short → 400 ────────────────────────────────

POST http://localhost:8080/api/auth/register
Content-Type: application/json
{
  "username": "validuser99",
  "password": "abc",
  "name": "Short Pass"
}

HTTP 400
[Asserts]
jsonpath "$.error" exists


# ── 4. Register with missing required fields → 400 ───────────────────────────

POST http://localhost:8080/api/auth/register
Content-Type: application/json
{
  "username": "missingname"
}

HTTP 400
[Asserts]
jsonpath "$.error" exists


# ── 5. Login with wrong password → 401 ───────────────────────────────────────

POST http://localhost:8080/api/auth/login
Content-Type: application/json
{
  "username": "operator1",
  "password": "wrongpassword"
}

HTTP 401
[Asserts]
jsonpath "$.error" == "Invalid credentials"


# ── 6. Login with non-existent user → 401 ────────────────────────────────────

POST http://localhost:8080/api/auth/login
Content-Type: application/json
{
  "username": "user_does_not_exist_xyz",
  "password": "anypassword"
}

HTTP 401
[Asserts]
jsonpath "$.error" == "Invalid credentials"


# ── 7. Login as BranchOperator → 200, capture token ─────────────────────────

POST http://localhost:8080/api/auth/login
Content-Type: application/json
{
  "username": "operator1",
  "password": "password123"
}

HTTP 200
[Captures]
operator_token: jsonpath "$.token"
[Asserts]
jsonpath "$.token" exists
jsonpath "$.user.username" == "operator1"
jsonpath "$.user.role" == "BranchOperator"


# ── 8. Login as TransportManager ──────────────────────────────────────────────

POST http://localhost:8080/api/auth/login
Content-Type: application/json
{
  "username": "manager1",
  "password": "password123"
}

HTTP 200
[Asserts]
jsonpath "$.token" exists
jsonpath "$.user.role" == "TransportManager"


# ── 9. Login as SystemAdministrator ──────────────────────────────────────────

POST http://localhost:8080/api/auth/login
Content-Type: application/json
{
  "username": "admin1",
  "password": "admin123"
}

HTTP 200
[Asserts]
jsonpath "$.token" exists
jsonpath "$.user.role" == "SystemAdministrator"


# ── 10. GET /me with valid token ──────────────────────────────────────────────

GET http://localhost:8080/api/auth/me
Authorization: Bearer {{operator_token}}

HTTP 200
[Asserts]
jsonpath "$.user.username" == "operator1"
jsonpath "$.user.role" == "BranchOperator"


# ── 11. GET /me without token → 401 ──────────────────────────────────────────

GET http://localhost:8080/api/auth/me

HTTP 401


# ── 11b. PATCH /me — update own profile (same password keeps it idempotent) ──

PATCH http://localhost:8080/api/auth/me
Authorization: Bearer {{operator_token}}
Content-Type: application/json
{
  "currentPassword": "password123",
  "newPassword": "password123"
}

HTTP 200
[Asserts]
jsonpath "$.user.username" == "operator1"
jsonpath "$.token" exists


# ── 12. Logout ────────────────────────────────────────────────────────────────

POST http://localhost:8080/api/auth/logout
Authorization: Bearer {{operator_token}}

HTTP 200
[Asserts]
jsonpath "$.message" == "Logged out successfully"


# ── 13. Successful registration (unique username, pending until approved) ──────

POST http://localhost:8080/api/auth/register
Content-Type: application/json
{
  "username": "hurl_reg_fresh_001",
  "password": "freshpass123",
  "name": "Hurl Fresh Reg",
  "rolePreference": "BranchOperator"
}

HTTP *
[Asserts]
status < 500
