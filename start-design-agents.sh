#!/bin/bash
# Start Proposer and Critique agents in background for Pac-Man design iteration

cd /home/user/claude-code

echo "🎮 Starting Multiplayer Pac-Man Design Iteration"
echo "================================================"
echo ""

# Create log directory
mkdir -p logs

# Kill any existing background Claude processes
pkill -f "claude.*proposer" 2>/dev/null
pkill -f "claude.*critique" 2>/dev/null

echo "📐 Starting PROPOSER Agent (background)..."

# Start Proposer Agent in background
nohup bash -c '
cd /home/user/claude-code
export AGENT_NAME="proposer"
echo "/beads-claim

Create comprehensive architectural design for multiplayer Pac-Man using Colyseus. Include:

1. Tech stack decisions (Colyseus, Node.js, TypeScript, HTML5 Canvas)
2. Game state schema for players, ghosts, maze, pellets
3. Network synchronization strategy (client-server architecture)
4. File and folder structure
5. Real-time communication flow diagrams
6. Data models with TypeScript interfaces
7. Multiplayer considerations (4 players, latency handling, state reconciliation)
8. Ghost AI architecture (4 different ghost behaviors)
9. Collision detection system
10. Scoring and win conditions

Be extremely detailed and specific. Save the design as examples/multiplayer-pacman/DESIGN_ITERATION_1.md

When complete, run /beads-complete
" | claude --no-session 2>&1
' > logs/proposer.log 2>&1 &

PROPOSER_PID=$!
echo "✅ Proposer Agent started (PID: $PROPOSER_PID)"
echo "   Log: logs/proposer.log"

echo ""
echo "🔍 Starting CRITIQUE Agent (background, will wait for Proposer)..."

# Start Critique Agent in background (will wait for proposer to complete)
nohup bash -c '
cd /home/user/claude-code

# Wait for proposer to complete (check every 30 seconds)
echo "Waiting for Proposer to complete claude-15..."
while true; do
    STATUS=$(bd --no-db list --json 2>/dev/null | jq -r ".[] | select(.id == \"claude-15\") | .status" 2>/dev/null)
    if [ "$STATUS" == "completed" ]; then
        echo "Proposer completed! Starting critique..."
        break
    fi
    sleep 30
done

export AGENT_NAME="critique"
echo "/beads-claim

Review the architectural design in DESIGN_ITERATION_1.md

Evaluate:
1. Completeness - Are all necessary components covered?
2. Technical accuracy - Are the technologies used correctly?
3. Scalability - Will this design handle 4+ concurrent players?
4. Code organization - Is the file structure logical?
5. Network efficiency - Is the sync strategy optimal?
6. Edge cases - Are error conditions handled?
7. Missing components - What is missing or unclear?
8. Better alternatives - Are there better approaches?

For each issue, provide:
- Severity (Critical/High/Medium/Low)
- Specific location in the design
- Detailed explanation of the problem
- Concrete suggestion for improvement

Rate the overall design quality: 0-100
- 0-50: Major issues, needs significant rework
- 51-70: Good foundation, needs refinement
- 71-89: Solid design, minor improvements
- 90-100: Excellent, ready to proceed

If quality < 90, list specific improvements needed for next iteration.

Save your critique as examples/multiplayer-pacman/CRITIQUE_ITERATION_1.md

When complete, run /beads-complete
" | claude --no-session 2>&1
' > logs/critique.log 2>&1 &

CRITIQUE_PID=$!
echo "✅ Critique Agent started (PID: $CRITIQUE_PID)"
echo "   Log: logs/critique.log"

echo ""
echo "🎯 Both agents running in background!"
echo ""
echo "📊 Monitor Progress:"
echo "   bd --no-db list --status in_progress"
echo "   bd --no-db list --status completed"
echo ""
echo "📖 View Logs:"
echo "   tail -f logs/proposer.log"
echo "   tail -f logs/critique.log"
echo ""
echo "🔍 Check Beads Status:"
echo "   /beads-status   (from Claude)"
echo "   bd --no-db ready"
echo ""
echo "PIDs:"
echo "   Proposer: $PROPOSER_PID"
echo "   Critique: $CRITIQUE_PID"
echo ""
echo "To stop agents:"
echo "   kill $PROPOSER_PID $CRITIQUE_PID"
