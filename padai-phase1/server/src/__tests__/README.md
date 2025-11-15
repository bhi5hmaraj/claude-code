# PadAI Server Tests

## Running Tests

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

## Test Structure

### Unit Tests (`beads.test.ts`)
Tests the bd CLI wrapper in isolation using mocks:
- Command execution
- Error handling
- Timeout behavior
- JSON parsing

### Integration Tests (`api.integration.test.ts`)
Tests the API endpoints with actual bd CLI:
- Creates temporary .beads/ folder
- Runs real bd commands
- Tests full request/response cycle
- Cleans up after tests

## Prerequisites

Integration tests require:
- `bd` CLI installed and in PATH
- Write permissions to /tmp

## Test Coverage Goals

- Unit tests: >80% coverage
- Integration tests: All endpoints covered
- E2E workflow: Claim → Complete cycle
