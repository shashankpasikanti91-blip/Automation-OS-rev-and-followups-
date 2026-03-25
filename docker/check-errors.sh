#!/bin/bash
echo "=== Recent app errors ==="
docker logs revenue-followups-app --tail=50 2>&1 | grep -E 'Error|error|TypeError|Cannot|undefined|null' | head -30
echo ""
echo "=== Testing renewals API ==="
CSRF=$(curl -s -c /tmp/test_c.txt 'https://automation.srpailabs.com/api/auth/csrf')
TOKEN=$(echo "$CSRF" | grep -o '"csrfToken":"[^"]*"' | cut -d'"' -f4)
curl -s -c /tmp/test_c.txt -b /tmp/test_c.txt -X POST 'https://automation.srpailabs.com/api/auth/callback/credentials' -H 'Content-Type: application/x-www-form-urlencoded' --data-urlencode "csrfToken=$TOKEN" --data-urlencode "email=admin@srpaios.demo" --data-urlencode "password=Admin@1234" --data-urlencode "tenantSlug=demo" > /dev/null 2>&1
echo "--- /api/revenue/renewals ---"
curl -s -b /tmp/test_c.txt 'https://automation.srpailabs.com/api/revenue/renewals' | python3 -m json.tool 2>/dev/null | head -40
echo ""
echo "--- /api/crm/leads ---"
curl -s -b /tmp/test_c.txt 'https://automation.srpailabs.com/api/crm/leads' | python3 -m json.tool 2>/dev/null | head -40
