#!/bin/bash

PORT=${1:-4100}
URL="http://127.0.0.1:$PORT/api/v1/active-clients"

echo "Checking active clients on $URL ..."
echo "---"

if response=$(curl -sf "$URL" 2>&1); then
  count=$(echo "$response" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['count'])" 2>/dev/null)
  echo "Active clients: $count"
  echo ""
  echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"
else
  echo "ERROR: Server not reachable at $URL"
  echo "$response"
  exit 1
fi
