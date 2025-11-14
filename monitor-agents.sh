#!/bin/bash
# Monitor multi-agent progress via Beads

cd /home/user/claude-code

while true; do
    clear
    echo "🎮 Multiplayer Pac-Man - Multi-Agent Status"
    echo "============================================"
    echo ""
    echo "⏰ $(date)"
    echo ""

    echo "📊 BEADS STATUS:"
    echo "----------------"

    # In Progress
    IN_PROGRESS=$(bd --no-db list --status in_progress 2>/dev/null)
    if [ -n "$IN_PROGRESS" ]; then
        echo "🔄 IN PROGRESS:"
        echo "$IN_PROGRESS" | head -10
        echo ""
    fi

    # Completed (last 5)
    echo "✅ RECENTLY COMPLETED:"
    bd --no-db list --status completed 2>/dev/null | tail -5
    echo ""

    # Ready Work
    echo "📋 READY TO CLAIM:"
    bd --no-db ready 2>/dev/null | head -3
    echo ""

    # Agent Processes
    echo "🤖 RUNNING AGENTS:"
    echo "----------------"
    PROPOSER_COUNT=$(ps aux | grep -c "[c]laude.*proposer")
    CRITIQUE_COUNT=$(ps aux | grep -c "[c]laude.*critique")
    echo "Proposer agents: $PROPOSER_COUNT"
    echo "Critique agents: $CRITIQUE_COUNT"
    echo ""

    # Logs preview
    if [ -f logs/proposer.log ]; then
        echo "📝 PROPOSER LOG (last 3 lines):"
        tail -3 logs/proposer.log 2>/dev/null
        echo ""
    fi

    if [ -f logs/critique.log ]; then
        echo "📝 CRITIQUE LOG (last 3 lines):"
        tail -3 logs/critique.log 2>/dev/null
        echo ""
    fi

    echo "Press Ctrl+C to exit | Refreshing in 10 seconds..."
    sleep 10
done
