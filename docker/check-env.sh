#!/bin/bash
echo "=== Container ENV ==="
docker exec revenue-followups-app env | grep -E 'NEXTAUTH|DATABASE|REDIS|NODE_ENV'
echo ""
echo "=== .env file ==="
cat /opt/revenue-followups/.env | grep -E 'NEXTAUTH|DATABASE|DIRECT'
echo ""
echo "=== DB connectivity test ==="
docker exec revenue-followups-app sh -c 'nc -z srp-postgres 5432 && echo "srp-postgres:OK" || echo "srp-postgres:FAIL"'
docker exec revenue-followups-app sh -c 'nc -z revenue-followups-db 5432 && echo "revenue-followups-db:OK" || echo "revenue-followups-db:FAIL"'
