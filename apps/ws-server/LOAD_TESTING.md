# Load Testing Guide

Comprehensive load testing suite for the Umati WebSocket server. Tests player capacity, concurrent lobbies, and connection stability.

## Quick Start

### Prerequisites

- k6 installed: `brew install k6`
- WebSocket server running on `ws://localhost:4000/ws`
- API server running on `http://localhost:3000`

### Run All Tests

```bash
# Single lobby capacity sweep (finds breaking point)
pnpm run loadtest:lobby-capacity:sweep

# Full game simulation (end-to-end)
pnpm run loadtest:ws

# Lobby join/leave capacity (basic)
pnpm run loadtest:lobby-capacity
```

---

## Detailed Test Scenarios

### 1. **Sustained Player Capacity** ✅ SCENARIO 1
**File:** `capacity-sustained.js`

Tests the **maximum consistent player capacity** for a single lobby over an extended period.

**What it tests:**
- Sustained connections without drops
- State consistency across players
- No race conditions during operation
- Connection stability over time

**Run it:**
```bash
k6 run load-tests/capacity-sustained.js \
  --vus=100 \
  -e MAX_PLAYERS=100 \
  -e HOLD_DURATION_SECONDS=300 \
  -e STATE_CHECK_INTERVAL_MS=5000
```

**Key parameters:**
- `MAX_PLAYERS`: Number of concurrent players (default: 50)
- `HOLD_DURATION_SECONDS`: How long to hold connections (default: 300 = 5 min)
- `STATE_CHECK_INTERVAL_MS`: How often to verify state (default: 5000ms)
- `PLAYER_JOIN_STAGGER_MS`: Delay between player joins (default: 20ms)

**Key metrics to monitor:**
- `sustained_ws_upgrade_rate` - Should be >99% (successful connections)
- `sustained_join_rejected_rate` - Should be <1% (all joins accepted)
- `sustained_socket_error_rate` - Should be <1% (no connection errors)
- `sustained_unexpected_disconnect_rate` - Should be <1% (stable connections)
- `sustained_state_received_rate` - Should be >95% (good state propagation)

**Example workflow:**
```bash
# Find the maximum player capacity with a binary search approach
for players in 50 75 100 120; do
  echo "Testing with $players players..."
  k6 run load-tests/capacity-sustained.js \
    --vus=$players \
    -e MAX_PLAYERS=$players \
    -e HOLD_DURATION_SECONDS=300
done
```

---

### 2. **Concurrent Lobbies** ✅ SCENARIO 2
**File:** `concurrent-lobbies.js`

Tests **multiple lobbies operating simultaneously**, each with the maximum safe player capacity.

**What it tests:**
- Multiple lobbies don't interfere with each other
- Lobby isolation is maintained
- Concurrent load on all lobbies
- Cross-lobby state integrity

**Run it:**
```bash
k6 run load-tests/concurrent-lobbies.js \
  -e LOBBIES=5 \
  -e PLAYERS_PER_LOBBY=50 \
  -e HOLD_DURATION_SECONDS=120
```

**Key parameters:**
- `LOBBIES`: Number of concurrent lobbies (default: 5)
- `PLAYERS_PER_LOBBY`: Players per lobby (default: 50)
- `HOLD_DURATION_SECONDS`: Connection hold time (default: 120 = 2 min)
- Total VUs = LOBBIES + (LOBBIES × PLAYERS_PER_LOBBY)
  - Example: 5 lobbies × 50 players = 250 VUs + 5 hosts = 255 total

**Key metrics to monitor:**
- `concurrent_ws_upgrade_rate` - Connection stability
- `concurrent_join_accepted_rate` - Capacity management
- `concurrent_join_rejected_rate` - Overflow handling
- `concurrent_lobbies_active` - Tracks active lobbies
- `concurrent_connections_per_lobby` - Gauge of players per lobby

**Example workflow:**
```bash
# Test if you can run 10 lobbies with 100 players each
k6 run load-tests/concurrent-lobbies.js \
  -e LOBBIES=10 \
  -e PLAYERS_PER_LOBBY=100 \
  -e HOLD_DURATION_SECONDS=180
```

---

### 3. **Connection Churn** ✅ SCENARIO 3 (BONUS)
**File:** `connection-churn.js`

Tests **rapid join/leave cycles** to detect resource leaks, improper cleanup, and race conditions.

**What it tests:**
- Proper socket cleanup
- No memory leaks under churn
- Recovery from high connection turnover
- Event handler accumulation issues
- Reconnection stability

**Run it:**
```bash
k6 run load-tests/connection-churn.js \
  --vus=50 \
  -e CYCLES=10 \
  -e HOLD_TIME_MS=2000
```

**Key parameters:**
- `TOTAL_VUS`: Number of concurrent players (default: 50)
- `CYCLES`: Number of join/leave cycles per player (default: 10)
- `HOLD_TIME_MS`: Duration each connection stays open (default: 2000ms)

**Key metrics to monitor:**
- `churn_ws_upgrade_rate` - Should be >90% (expect some churn failures)
- `churn_graceful_close_rate` - Should be >90% (clean disconnects)
- `churn_socket_error_rate` - Should be <10%
- `churn_cycles_completed_count` - Should match VU count

**Example workflow:**
```bash
# Stress test with 100 players, 20 cycles each, 1s hold
k6 run load-tests/connection-churn.js \
  --vus=100 \
  -e CYCLES=20 \
  -e HOLD_TIME_MS=1000
```

---

### 4. **Lobby Capacity Sweep** (Existing)
**File:** `lobby-capacity-sweep.mjs`

Automatically sweeps through player counts to find the breaking point.

```bash
SWEEP_START=10 SWEEP_END=200 SWEEP_STEP=10 \
  STOP_ON_FAILURE=true \
  pnpm run loadtest:lobby-capacity:sweep
```

**Output shows:**
- Highest passing MAX_PLAYERS
- First failing MAX_PLAYERS
- Metrics for each sweep value

---

### 5. **Full Game Simulation** (Existing)
**File:** `ws-server.js`

Complete end-to-end test simulating real gameplay (trivia/herd mentality games).

```bash
k6 run load-tests/ws-server.js \
  --vus=50 \
  -e TOTAL_PLAYERS=50 \
  -e TRIVIA_ROUNDS=5
```

---

## Recommended Test Flow

### Phase 1: Find Maximum Capacity

```bash
# Use the sweep to find max stable player count
SWEEP_START=50 SWEEP_END=200 SWEEP_STEP=25 \
  pnpm run loadtest:lobby-capacity:sweep

# This will output:
# Highest passing MAX_PLAYERS: 150
# First failing MAX_PLAYERS: 175
```

### Phase 2: Validate Sustained Capacity

Once you know the max from Phase 1, say it's **150 players**:

```bash
# Test sustained capacity for 10 minutes
k6 run load-tests/capacity-sustained.js \
  --vus=150 \
  -e MAX_PLAYERS=150 \
  -e HOLD_DURATION_SECONDS=600
```

### Phase 3: Test Concurrent Lobbies

```bash
# If 150 is stable, test 5 concurrent lobbies with 150 each
k6 run load-tests/concurrent-lobbies.js \
  -e LOBBIES=5 \
  -e PLAYERS_PER_LOBBY=150 \
  -e HOLD_DURATION_SECONDS=300
```

### Phase 4: Stress Test Connection Stability

```bash
# Rapid churn with 100 players
k6 run load-tests/connection-churn.js \
  --vus=100 \
  -e CYCLES=50 \
  -e HOLD_TIME_MS=1000
```

### Phase 5: Real-World Simulation

```bash
# Full game with found capacity
k6 run load-tests/ws-server.js \
  --vus=150 \
  -e TOTAL_PLAYERS=150 \
  -e TRIVIA_ROUNDS=10
```

---

## Environment Variables

Common across all tests:

- `WS_URL` - WebSocket URL (default: `ws://localhost:4000/ws`)
- `API_BASE_URL` - API base URL (default: `http://localhost:3000`)
- `HOST_AVATAR` - Avatar URL for test hosts/players

Test-specific:

| Test | Variable | Default | Notes |
|------|----------|---------|-------|
| capacity-sustained | `MAX_PLAYERS` | 50 | Players per lobby |
| capacity-sustained | `HOLD_DURATION_SECONDS` | 300 | Test duration |
| capacity-sustained | `STATE_CHECK_INTERVAL_MS` | 5000 | State verification interval |
| concurrent-lobbies | `LOBBIES` | 5 | Number of concurrent lobbies |
| concurrent-lobbies | `PLAYERS_PER_LOBBY` | 50 | Players in each lobby |
| concurrent-lobbies | `HOLD_DURATION_SECONDS` | 120 | Connection hold time |
| connection-churn | `TOTAL_VUS` | 50 | Concurrent players |
| connection-churn | `CYCLES` | 10 | Join/leave cycles per player |
| connection-churn | `HOLD_TIME_MS` | 2000 | Duration per connection |

---

## Reading k6 Output

When a test runs, you'll see output like:

```
✓ sustained_ws_upgrade_rate...... 0.99 (expected >0.99)
✓ sustained_join_accepted_rate... 0.99 (expected >0.99)
✓ sustained_socket_error_rate.... 0.00 (expected <0.01)
✓ sustained_unexpected_disconnect_rate... 0.00 (expected <0.01)
✓ sustained_state_received_rate.. 0.97 (expected >0.95)
✓ http_req_failed............ 0.00 (expected <0.05)

█ sustained_active_connections. 98 (current gauge value)
```

**Key thresholds:**
- ✓ Green = PASSED
- ✗ Red = FAILED
- Gauge values show current state (not pass/fail)

---

## Troubleshooting

### Test hangs
- Increase `maxDuration` in the test file
- Check that API and WS servers are running

### High error rates
- Reduce VU count (too many connections at once)
- Increase `PLAYER_JOIN_STAGGER_MS` (space out joins)
- Check server logs for bottlenecks

### Out of memory
- Reduce `NUM_LOBBIES` or `PLAYERS_PER_LOBBY`
- This indicates your server is hitting limits

### Connection timeouts
- Verify WS server is accepting connections
- Check firewall/network settings
- Increase `maxDuration` if tests timeout

---

## Performance Tips

1. **Start small:** Begin with lower player counts and scale up
2. **Isolate variables:** Test one scenario at a time
3. **Monitor server:** Watch CPU, memory, and connection counts during tests
4. **Stagger joins:** Use `PLAYER_JOIN_STAGGER_MS` to avoid thundering herd
5. **Use gauges:** Watch `_active_connections` gauges to verify concurrent load

---

## Next Steps

After establishing baselines:
1. Record max capacity numbers
2. Monitor resource usage at those levels
3. Implement autoscaling if needed
4. Run regularly as part of CI/CD
5. Compare against previous baselines to detect regressions
