#!/bin/bash
# Start 3 creative agents for Multiplayer Pac-Man development

cd /home/user/claude-code

echo "🎮 Starting 3-Agent Team for Multiplayer Pac-Man"
echo "================================================"

# Create log directory
mkdir -p logs

# Kill any existing agent processes
pkill -f "claude.*AGENT_NAME" 2>/dev/null

BOT_TOKEN="8202873720:AAHq8BsGlQ6jI2ouRtsT3BeAoGiLo4nxkwo"
CHAT_ID="5752511985"

# Announce launch
curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/sendMessage" \
  -H "Content-Type: application/json" \
  -d "{
    \"chat_id\": \"${CHAT_ID}\",
    \"text\": \"🚀 *3-AGENT TEAM LAUNCHING*\\n\\n🏛️ *ARCHITECT* - Design refinement\\n🔨 *BUILDER* - Implementation prep\\n📜 *SCRIBE* - Documentation\\n\\nStarting now...\",
    \"parse_mode\": \"Markdown\"
  }" > /dev/null 2>&1

echo ""
echo "🏛️  Starting ARCHITECT Agent (Design Iteration 2)..."

# Agent 1: ARCHITECT - Revise design based on critique
nohup bash -c '
cd /home/user/claude-code
export AGENT_NAME="architect"
BOT_TOKEN="8202873720:AAHq8BsGlQ6jI2ouRtsT3BeAoGiLo4nxkwo"
CHAT_ID="5752511985"

curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/sendMessage" \
  -H "Content-Type: application/json" \
  -d "{
    \"chat_id\": \"${CHAT_ID}\",
    \"text\": \"🏛️ *ARCHITECT checking in!*\\n\\nClaiming claude-17 (Design Iteration 2)\\nTask: Address critique feedback\\n\\nReading CRITIQUE_ITERATION_1.md now...\",
    \"parse_mode\": \"Markdown\"
  }" > /dev/null 2>&1

echo "/beads-claim

I am ARCHITECT 🏛️, revising the Pac-Man design based on critique feedback.

Read CRITIQUE_ITERATION_1.md and address ALL 6 issues:

CRITICAL (Must Fix):
1. Add reconnection logic (30-second window)
2. Add server-side pellet validation
3. Fix ghost collision radius (0.3 → 0.5 tiles)

MEDIUM (Should Fix):
4. Add lag compensation strategy
5. Add DDoS protection plan
6. Add tie-breaker rules

Create DESIGN_ITERATION_2.md with:
- Sections updated to address each issue
- Clear explanations of how problems were solved
- Keep MVP-focused (no over-complication)

Target score: 85-90/100

Send Telegram update when starting each section.
When done, run /beads-complete
" | claude --no-session 2>&1
' > logs/architect.log 2>&1 &

ARCHITECT_PID=$!
echo "   ✅ ARCHITECT started (PID: $ARCHITECT_PID)"
echo "   📄 Log: logs/architect.log"

sleep 2

echo ""
echo "🔨 Starting BUILDER Agent (Implementation Prep)..."

# Agent 2: BUILDER - Start preparing server structure
nohup bash -c '
cd /home/user/claude-code
export AGENT_NAME="builder"
BOT_TOKEN="8202873720:AAHq8BsGlQ6jI2ouRtsT3BeAoGiLo4nxkwo"
CHAT_ID="5752511985"

sleep 10

curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/sendMessage" \
  -H "Content-Type: application/json" \
  -d "{
    \"chat_id\": \"${CHAT_ID}\",
    \"text\": \"🔨 *BUILDER reporting!*\\n\\nPreparing implementation scaffolding\\nTask: Set up project structure\\n\\nCreating package.json, tsconfig, folders...\",
    \"parse_mode\": \"Markdown\"
  }" > /dev/null 2>&1

echo "/beads-discover Set up initial Colyseus server scaffolding

I am BUILDER 🔨, preparing the implementation environment.

Create the basic project structure:
- examples/multiplayer-pacman/server/ (Colyseus backend)
- examples/multiplayer-pacman/client/ (HTML5 frontend)
- package.json with Colyseus dependencies
- tsconfig.json for TypeScript
- Basic folder structure from design

Keep it minimal - just scaffolding for now.

Send Telegram update when each major folder is created.
When done, commit and send completion message to Telegram.
" | claude --no-session 2>&1
' > logs/builder.log 2>&1 &

BUILDER_PID=$!
echo "   ✅ BUILDER started (PID: $BUILDER_PID)"
echo "   📄 Log: logs/builder.log"

sleep 2

echo ""
echo "📜 Starting SCRIBE Agent (Documentation)..."

# Agent 3: SCRIBE - Create implementation guide
nohup bash -c '
cd /home/user/claude-code
export AGENT_NAME="scribe"
BOT_TOKEN="8202873720:AAHq8BsGlQ6jI2ouRtsT3BeAoGiLo4nxkwo"
CHAT_ID="5752511985"

sleep 15

curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/sendMessage" \
  -H "Content-Type: application/json" \
  -d "{
    \"chat_id\": \"${CHAT_ID}\",
    \"text\": \"📜 *SCRIBE online!*\\n\\nDocumenting implementation roadmap\\nTask: Create step-by-step dev guide\\n\\nDrafting IMPLEMENTATION_PLAN.md...\",
    \"parse_mode\": \"Markdown\"
  }" > /dev/null 2>&1

echo "/beads-discover Create implementation plan and development guide

I am SCRIBE 📜, documenting the path forward.

Create examples/multiplayer-pacman/IMPLEMENTATION_PLAN.md with:

1. Quick Start Guide
   - How to run server
   - How to run client
   - Environment variables

2. Development Phases
   - Phase 1: Server basics
   - Phase 2: Client basics
   - Phase 3: Multiplayer sync
   - Phase 4: Game logic

3. Testing Strategy
   - Unit tests
   - Integration tests
   - Multiplayer tests (2-4 players)

4. Deployment Checklist
   - Production config
   - Hosting options

Keep it practical and MVP-focused.

Send Telegram update for each section completed.
When done, commit and notify via Telegram.
" | claude --no-session 2>&1
' > logs/scribe.log 2>&1 &

SCRIBE_PID=$!
echo "   ✅ SCRIBE started (PID: $SCRIBE_PID)"
echo "   📄 Log: logs/scribe.log"

echo ""
echo "🎯 All 3 agents running!"
echo ""
echo "📊 Monitor Progress:"
echo "   tail -f logs/architect.log"
echo "   tail -f logs/builder.log"
echo "   tail -f logs/scribe.log"
echo ""
echo "📱 Telegram Updates Enabled"
echo ""
echo "PIDs:"
echo "   🏛️  ARCHITECT: $ARCHITECT_PID"
echo "   🔨 BUILDER: $BUILDER_PID"
echo "   📜 SCRIBE: $SCRIBE_PID"
echo ""
echo "To stop all agents:"
echo "   kill $ARCHITECT_PID $BUILDER_PID $SCRIBE_PID"
echo ""
