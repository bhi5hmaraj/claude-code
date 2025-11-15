#!/bin/bash
# Test script to simulate agent workflow

set -e

AGENT_NAME="${1:-agent-test}"
API_URL="${2:-http://localhost:8000}"

echo "🤖 Agent: $AGENT_NAME"
echo "🌐 API: $API_URL"
echo ""

# Check server health
echo "1️⃣  Checking server health..."
curl -s $API_URL/ | jq
echo ""

# Get status
echo "2️⃣  Getting project status..."
STATUS=$(curl -s $API_URL/api/status)
echo $STATUS | jq
echo ""

READY_COUNT=$(echo $STATUS | jq -r '.ready')
if [ "$READY_COUNT" -eq 0 ]; then
    echo "❌ No tasks ready to claim"
    exit 0
fi

# Claim task
echo "3️⃣  Claiming next task..."
TASK=$(curl -s -X POST $API_URL/api/claim \
  -H "Content-Type: application/json" \
  -d "{\"agent_name\": \"$AGENT_NAME\"}")

TASK_ID=$(echo $TASK | jq -r '.task.id')
TASK_TITLE=$(echo $TASK | jq -r '.task.title')

echo "✅ Claimed: $TASK_ID - $TASK_TITLE"
echo ""

# Simulate work
echo "4️⃣  Working on task..."
sleep 2
echo "✅ Task implementation complete"
echo ""

# Complete task
echo "5️⃣  Marking task as completed..."
COMPLETE=$(curl -s -X POST $API_URL/api/complete \
  -H "Content-Type: application/json" \
  -d "{\"task_id\": \"$TASK_ID\"}")

echo $COMPLETE | jq
echo ""

# Final status
echo "6️⃣  Final project status..."
curl -s $API_URL/api/status | jq
echo ""

echo "🎉 Agent workflow completed successfully!"
