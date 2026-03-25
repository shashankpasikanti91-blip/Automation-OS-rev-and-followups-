#!/bin/bash
set -e

DOMAIN="https://automation.srpailabs.com"
COOKIES="/tmp/srp_e2e_cookies.txt"
rm -f $COOKIES

echo "=== SRP AI OS E2E Test ==="
echo "Domain: $DOMAIN"
echo ""

# 1. Public pages
echo "--- Public Pages ---"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$DOMAIN/")
echo "GET /           → $STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$DOMAIN/login")
echo "GET /login      → $STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$DOMAIN/pricing")
echo "GET /pricing    → $STATUS"

# 2. Protected routes should redirect
echo ""
echo "--- Protected Routes (expect 307) ---"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-redirs 0 "$DOMAIN/dashboard")
echo "GET /dashboard  → $STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-redirs 0 "$DOMAIN/crm")
echo "GET /crm        → $STATUS"

# 3. Auth providers
echo ""
echo "--- Auth ---"
PROVIDERS=$(curl -s "$DOMAIN/api/auth/providers")
echo "GET /api/auth/providers → $PROVIDERS"

# 4. Get CSRF token
CSRF_JSON=$(curl -s -c $COOKIES "$DOMAIN/api/auth/csrf")
CSRF_TOKEN=$(echo "$CSRF_JSON" | grep -o '"csrfToken":"[^"]*"' | cut -d'"' -f4)
echo "CSRF Token: ${CSRF_TOKEN:0:20}..."

# 5. Login with demo credentials
echo ""
echo "--- Login (admin@srpaios.demo / Admin@1234) ---"
LOGIN_RESP=$(curl -s -c $COOKIES -b $COOKIES \
  -X POST "$DOMAIN/api/auth/callback/credentials" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "csrfToken=$CSRF_TOKEN" \
  --data-urlencode "email=admin@srpaios.demo" \
  --data-urlencode "password=Admin@1234" \
  --data-urlencode "tenantSlug=demo" \
  --data-urlencode "redirect=false" \
  --data-urlencode "callbackUrl=$DOMAIN/dashboard" \
  --data-urlencode "json=true" \
  -w "\nHTTP_STATUS:%{http_code}")
STATUS=$(echo "$LOGIN_RESP" | grep "HTTP_STATUS:" | cut -d: -f2)
echo "POST /api/auth/callback/credentials → $STATUS"
echo "$LOGIN_RESP" | head -3

# 6. Check session
echo ""
echo "--- Session ---"
SESSION=$(curl -s -b $COOKIES "$DOMAIN/api/auth/session")
echo "GET /api/auth/session → $SESSION"

# 7. API endpoints (using session cookie)
echo ""
echo "--- API Endpoints ---"
for ENDPOINT in "revenue/follow-ups" "revenue/renewals" "crm/contacts" "crm/leads" "crm/organizations" "documents" "dashboard" "reports" "communications" "workflows"; do
  RESP=$(curl -s -b $COOKIES -o /dev/null -w "%{http_code}" "$DOMAIN/api/$ENDPOINT")
  echo "GET /api/$ENDPOINT → $RESP"
done

echo ""
echo "=== E2E Test Complete ==="
