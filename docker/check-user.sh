#!/bin/bash
echo "=== User table schema ==="
docker exec revenue-followups-db psql -U srpaios -d srpaios -c "\d \"User\""
echo ""
echo "=== User data ==="
docker exec revenue-followups-db psql -U srpaios -d srpaios -c "SELECT id, email, name, \"tenantId\" FROM \"User\" LIMIT 5;"
