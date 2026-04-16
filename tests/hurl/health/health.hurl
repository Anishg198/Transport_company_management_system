# ── Health Check ──────────────────────────────────────────────────────────────

GET http://localhost:8080/api/health

HTTP 200
[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.service" exists
