#!/bin/bash
# Multi-Agent Beads Orchestration Demo
# Simulates 3 Claude agents working concurrently on a shared project

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Agent names
AGENT_1="claude-agent-architect"
AGENT_2="claude-agent-backend"
AGENT_3="claude-agent-frontend"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Multi-Agent Beads Orchestration Demo${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Function to print agent actions
agent_log() {
    local agent=$1
    local action=$2
    local color=$3
    echo -e "${color}[$agent]${NC} $action"
}

# Function to pause and show state
show_state() {
    echo ""
    echo -e "${PURPLE}=== Current State ===${NC}"
    bd --no-db list --json | jq -r '.[] | "\(.id) [\(.status)] \(.title) @\(.assignee // "unassigned")"'
    echo ""
    sleep 2
}

echo -e "${CYAN}Step 1: Initialize project with epic${NC}"
echo "Creating main epic for user authentication system..."
echo ""

bd --no-db create "Epic: Build complete user authentication system" \
    -d "Implement login, signup, JWT tokens, password reset, and security features" \
    --type epic \
    --priority 0

EPIC_ID=$(bd --no-db list --type epic --json | jq -r '.[0].id')
agent_log "System" "Created $EPIC_ID (Epic)" "$GREEN"
show_state

# ============================================
# AGENT 1: ARCHITECT - Decomposes epic
# ============================================

echo -e "${CYAN}Step 2: Agent 1 (Architect) decomposes epic${NC}"
agent_log "$AGENT_1" "Claiming epic for decomposition..." "$YELLOW"

bd --no-db update $EPIC_ID --status in_progress --assignee "$AGENT_1"

agent_log "$AGENT_1" "Breaking down into subtasks..." "$YELLOW"

# Create subtasks with dependencies
bd --no-db create "Design authentication architecture" \
    --parent $EPIC_ID \
    --priority 0 \
    --type task \
    -d "Define JWT strategy, session management, security requirements"

BD_2=$(bd --no-db list --json | jq -r '.[-1].id')

bd --no-db create "Implement JWT service" \
    --parent $EPIC_ID \
    --priority 1 \
    --type feature \
    -d "Token generation, validation, refresh logic" \
    --blocks bd-4 --blocks bd-5

BD_3=$(bd --no-db list --json | jq -r '.[-1].id')

bd --no-db create "Build login API endpoint" \
    --parent $EPIC_ID \
    --priority 1 \
    --type feature \
    -d "POST /api/auth/login with email/password"

BD_4=$(bd --no-db list --json | jq -r '.[-1].id')

bd --no-db create "Build login UI component" \
    --parent $EPIC_ID \
    --priority 1 \
    --type feature \
    -d "React component with form validation"

BD_5=$(bd --no-db list --json | jq -r '.[-1].id')

bd --no-db create "Add password reset flow" \
    --parent $EPIC_ID \
    --priority 2 \
    --type feature \
    -d "Email-based password reset with secure tokens"

BD_6=$(bd --no-db list --json | jq -r '.[-1].id')

bd --no-db create "Write integration tests" \
    --parent $EPIC_ID \
    --priority 3 \
    --type task \
    -d "End-to-end tests for complete auth flow"

BD_7=$(bd --no-db list --json | jq -r '.[-1].id')

agent_log "$AGENT_1" "Created 6 subtasks with dependencies" "$YELLOW"
agent_log "$AGENT_1" "Completing architecture design..." "$YELLOW"

bd --no-db close $BD_2 --reason "Architecture documented in DESIGN.md"

show_state

# ============================================
# AGENT 2: BACKEND - Claims JWT service
# ============================================

echo -e "${CYAN}Step 3: Agent 2 (Backend) claims JWT service${NC}"

# Check ready work
READY_WORK=$(bd --no-db ready --json | jq -r '.[0].id')
agent_log "$AGENT_2" "Checking ready work: $READY_WORK" "$GREEN"

bd --no-db update $BD_3 --status in_progress --assignee "$AGENT_2"
agent_log "$AGENT_2" "Claimed $BD_3 (JWT service)" "$GREEN"

sleep 1

agent_log "$AGENT_2" "Working on JWT service..." "$GREEN"
agent_log "$AGENT_2" "Discovered: Need token refresh logic!" "$GREEN"

# Discover new work
bd --no-db create "Add JWT token refresh mechanism" \
    -d "Implement refresh tokens with 7-day expiry" \
    --type feature \
    --priority 1 \
    --dep-from $BD_3 \
    --blocks $BD_3

BD_8=$(bd --no-db list --json | jq -r '.[-1].id')
agent_log "$AGENT_2" "Created $BD_8 (blocker discovered)" "$GREEN"

agent_log "$AGENT_2" "Switching to $BD_8 (must complete before $BD_3)..." "$GREEN"
bd --no-db update $BD_3 --status open --assignee ""
bd --no-db update $BD_8 --status in_progress --assignee "$AGENT_2"

show_state

# ============================================
# AGENT 3: FRONTEND - Claims login UI
# ============================================

echo -e "${CYAN}Step 4: Agent 3 (Frontend) tries to claim login UI${NC}"

READY_WORK=$(bd --no-db ready --json | jq -r '.[0].id')
agent_log "$AGENT_3" "Checking ready work: $READY_WORK" "$BLUE"

if [ "$READY_WORK" == "$BD_5" ]; then
    agent_log "$AGENT_3" "Login UI ($BD_5) is blocked by JWT service ($BD_3)" "$BLUE"
    agent_log "$AGENT_3" "Looking for other work..." "$BLUE"
fi

# Check if password reset is ready
READY_WORK=$(bd --no-db ready --json | jq -r 'map(select(.id != "'$BD_5'")) | .[0].id')

if [ "$READY_WORK" == "$BD_6" ]; then
    agent_log "$AGENT_3" "Found ready work: $BD_6 (Password reset)" "$BLUE"
    bd --no-db update $BD_6 --status in_progress --assignee "$AGENT_3"
    agent_log "$AGENT_3" "Claimed $BD_6" "$BLUE"
fi

show_state

# ============================================
# AGENT 2: BACKEND - Completes token refresh
# ============================================

echo -e "${CYAN}Step 5: Agent 2 completes token refresh${NC}"

agent_log "$AGENT_2" "Implemented refresh token logic" "$GREEN"
bd --no-db close $BD_8 --reason "Added RefreshTokenService with Redis storage"

agent_log "$AGENT_2" "Checking what's unblocked..." "$GREEN"
UNBLOCKED=$(bd --no-db ready --json | jq -r '.[] | select(.id == "'$BD_3'") | .id')

if [ -n "$UNBLOCKED" ]; then
    agent_log "$AGENT_2" "$BD_3 is now unblocked! Claiming it..." "$GREEN"
    bd --no-db update $BD_3 --status in_progress --assignee "$AGENT_2"
fi

show_state

# ============================================
# AGENT 2: BACKEND - Completes JWT service
# ============================================

echo -e "${CYAN}Step 6: Agent 2 completes JWT service${NC}"

agent_log "$AGENT_2" "Implementing JWT service..." "$GREEN"
sleep 1

bd --no-db close $BD_3 --reason "Implemented JWTService with token generation, validation, and refresh"

agent_log "$AGENT_2" "JWT service complete! This unblocks login API and UI" "$GREEN"

show_state

# ============================================
# AGENT 2 & 3: PARALLEL - Work on API and UI
# ============================================

echo -e "${CYAN}Step 7: Agents 2 & 3 work in parallel${NC}"

# Agent 2: Claims login API
READY_API=$(bd --no-db ready --json | jq -r '.[] | select(.id == "'$BD_4'") | .id')
if [ -n "$READY_API" ]; then
    bd --no-db update $BD_4 --status in_progress --assignee "$AGENT_2"
    agent_log "$AGENT_2" "Claimed $BD_4 (Login API)" "$GREEN"
fi

# Agent 3: Completes password reset, claims login UI
bd --no-db close $BD_6 --reason "Implemented password reset with email tokens"
agent_log "$AGENT_3" "Completed $BD_6 (Password reset)" "$BLUE"

READY_UI=$(bd --no-db ready --json | jq -r '.[] | select(.id == "'$BD_5'") | .id')
if [ -n "$READY_UI" ]; then
    bd --no-db update $BD_5 --status in_progress --assignee "$AGENT_3"
    agent_log "$AGENT_3" "Claimed $BD_5 (Login UI)" "$BLUE"
fi

show_state

# ============================================
# AGENTS COMPLETE WORK
# ============================================

echo -e "${CYAN}Step 8: Agents complete their work${NC}"

# Agent 2 completes login API
agent_log "$AGENT_2" "Implementing login API endpoint..." "$GREEN"
bd --no-db close $BD_4 --reason "Added POST /api/auth/login with validation and JWT generation"

# Agent 3 completes login UI
agent_log "$AGENT_3" "Building login UI component..." "$BLUE"
bd --no-db close $BD_5 --reason "Created LoginForm component with validation and error handling"

show_state

# ============================================
# FINAL STATUS
# ============================================

echo -e "${CYAN}Step 9: Final status check${NC}"

# Check what's left
READY_WORK=$(bd --no-db ready --json | jq -r '.[].id')
if [ -n "$READY_WORK" ]; then
    agent_log "System" "Remaining work: $READY_WORK" "$PURPLE"
fi

# Show completion stats
TOTAL=$(bd --no-db list --json | jq 'length')
COMPLETED=$(bd --no-db list --status completed --json | jq 'length')
IN_PROGRESS=$(bd --no-db list --status in_progress --json | jq 'length')
OPEN=$(bd --no-db list --status open --json | jq 'length')

echo ""
echo -e "${PURPLE}=== Final Statistics ===${NC}"
echo -e "Total issues: $TOTAL"
echo -e "${GREEN}Completed: $COMPLETED${NC}"
echo -e "${YELLOW}In progress: $IN_PROGRESS${NC}"
echo -e "${BLUE}Open: $OPEN${NC}"
echo ""

# Show dependency tree
echo -e "${PURPLE}=== Dependency Tree ===${NC}"
bd --no-db dep tree $EPIC_ID

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Multi-Agent Demo Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Key Observations:"
echo "1. ✅ Agents coordinated via shared Beads database"
echo "2. ✅ Dependencies prevented conflicts (JWT blocked UI/API)"
echo "3. ✅ Agents discovered new work dynamically (token refresh)"
echo "4. ✅ Parallel execution when possible (API + UI)"
echo "5. ✅ Clear audit trail of who did what"
echo ""
echo "Try running: bd --no-db list --json | jq"
