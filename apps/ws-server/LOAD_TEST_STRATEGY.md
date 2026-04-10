# Load Test Strategy Summary

## Your Requirements → Tests Created

### ✅ Requirement 1: Max Consistent Player Capacity (No Drops/Race Conditions)

**Test:** `capacity-sustained.js` 
**Script:** `pnpm run loadtest:capacity-sustained`

**What it does:**
- Spins up N players into a single lobby
- Holds connections for configurable duration (default 5 mins)
- Verifies all players receive state updates consistently
- Monitors for dropped connections, socket errors, message losses
- Measures connection drop rate and state inconsistencies

**Sample command:**
```bash
k6 run load-tests/capacity-sustained.js \
  --vus=100 \
  -e MAX_PLAYERS=100 \
  -e HOLD_DURATION_SECONDS=600 \
  -e STATE_CHECK_INTERVAL_MS=5000
```

**Critical metrics:**
- `sustained_unexpected_disconnect_rate` - MUST be <1%
- `sustained_socket_error_rate` - MUST be <1%
- `sustained_state_received_rate` - SHOULD be >95%
- `sustained_join_rejected_rate` - MUST be <1% (all joins succeed)

**How to use it:**
```bash
# Binary search for max capacity
for players in 50 100 150 200; do
  k6 run load-tests/capacity-sustained.js \
    --vus=$players -e MAX_PLAYERS=$players -e HOLD_DURATION_SECONDS=300
done
# ^ Find the highest player count where all thresholds still pass
```

---

### ✅ Requirement 2: Max Concurrent Lobbies with Max Capacity

**Test:** `concurrent-lobbies.js`
**Script:** `pnpm run loadtest:concurrent-lobbies`

**What it does:**
- Creates N lobbies simultaneously
- Each lobby has M players (the max you found from requirement 1)
- Verifies lobbies don't interfere with each other
- Maintains isolation between lobbies
- Detects cross-lobby message routing bugs

**Sample command:**
```bash
# Assuming you found 100 is max from requirement 1
k6 run load-tests/concurrent-lobbies.js \
  -e LOBBIES=10 \
  -e PLAYERS_PER_LOBBY=100 \
  -e HOLD_DURATION_SECONDS=300
```

**Total connections = 10 lobbies + (10 × 100 players) = 1,010 concurrent connections**

**Critical metrics:**
- `concurrent_join_accepted_rate` - SHOULD be >95%
- `concurrent_join_rejected_rate` - SHOULD be <5%
- `concurrent_socket_error_rate` - MUST be <5%
- `concurrent_lobbies_active` - Should track all 10 lobbies

**How to use it:**
```bash
# After establishing max capacity (say 100), test concurrent lobbies
k6 run load-tests/concurrent-lobbies.js \
  -e LOBBIES=5 \
  -e PLAYERS_PER_LOBBY=100

# Scale up gradually
k6 run load-tests/concurrent-lobbies.js \
  -e LOBBIES=10 \
  -e PLAYERS_PER_LOBBY=100

# Find your limit
k6 run load-tests/concurrent-lobbies.js \
  -e LOBBIES=20 \
  -e PLAYERS_PER_LOBBY=100
```

---

### ✅ Requirement 3: Other Relevant Load Tests

**Test:** `connection-churn.js`
**Script:** `pnpm run loadtest:connection-churn`

**What it tests:**
- Rapid join/leave cycles (connection churn)
- Proper cleanup of disconnected players
- Memory leak detection
- Recovery from high turnover
- Race conditions during disconnect

**Why it matters:**
- Real apps have users leaving/joining constantly
- Detects resource leaks that only show up under churn
- Reveals improper event handler cleanup
- Tests reconnection logic

**Sample command:**
```bash
# 50 players, 10 join/leave cycles each, hold 2 seconds per connection
k6 run load-tests/connection-churn.js \
  --vus=50 \
  -e CYCLES=10 \
  -e HOLD_TIME_MS=2000

# Stress test version: 200 cycles per player, 1 second holds
k6 run load-tests/connection-churn.js \
  --vus=50 \
  -e CYCLES=200 \
  -e HOLD_TIME_MS=1000
```

**Critical metrics:**
- `churn_graceful_close_rate` - SHOULD be >90%
- `churn_socket_error_rate` - SHOULD be <10%
- Monitor for memory growth in server process

---

## Complete Test Workflow (Recommended)

### Step 1: Find Max Player Capacity (~10-15 minutes)

```bash
# Use existing sweep test or run capacity-sustained with increasing VUs
pnpm run loadtest:lobby-capacity:sweep

# Output will tell you:
# Highest passing MAX_PLAYERS: 150
# First failing MAX_PLAYERS: 175
```

**Decision point:** If first failure at 175, your safe max is **150-160 players/lobby**

---

### Step 2: Validate Sustained Stability at Max (10 min per iteration)

```bash
# Use capacity you found (e.g., 150) and test for 10 minutes
k6 run load-tests/capacity-sustained.js \
  --vus=150 \
  -e MAX_PLAYERS=150 \
  -e HOLD_DURATION_SECONDS=600

# If thresholds pass, you have your confirmed baseline
```

**Decision point:** If all metrics pass, **150/lobby is stable**

---

### Step 3: Test Concurrent Lobbies (5-10 minutes)

```bash
# Test with 5 concurrent lobbies at your max capacity
k6 run load-tests/concurrent-lobbies.js \
  -e LOBBIES=5 \
  -e PLAYERS_PER_LOBBY=150 \
  -e HOLD_DURATION_SECONDS=300

# If successful, try higher
k6 run load-tests/concurrent-lobbies.js \
  -e LOBBIES=10 \
  -e PLAYERS_PER_LOBBY=150 \
  -e HOLD_DURATION_SECONDS=300

# Find your limit
k6 run load-tests/concurrent-lobbies.js \
  -e LOBBIES=20 \
  -e PLAYERS_PER_LOBBY=150 \
  -e HOLD_DURATION_SECONDS=300
```

**Decision point:** Note max concurrent lobbies **e.g., 10 lobbies × 150 = 1,500 players system capacity**

---

### Step 4: Stress Test Connection Churn (5-10 minutes)

```bash
# Test connection stability under rapid churn
k6 run load-tests/connection-churn.js \
  --vus=100 \
  -e CYCLES=20 \
  -e HOLD_TIME_MS=1000

# More extreme test
k6 run load-tests/connection-churn.js \
  --vus=200 \
  -e CYCLES=50 \
  -e HOLD_TIME_MS=500
```

**Decision point:** Confirm no memory leaks, all connections clean up properly

---

### Step 5: Real-World Game Simulation (5-10 minutes)

```bash
# Run actual game with your max capacity
k6 run load-tests/ws-server.js \
  --vus=150 \
  -e TOTAL_PLAYERS=150 \
  -e TRIVIA_ROUNDS=5
```

**Decision point:** Confirm everything works end-to-end

---

## Expected Results Format

After running the test suite, you should document:

```
LOAD TEST RESULTS SUMMARY
========================

1. Single Lobby Max Capacity
   - Maximum players per lobby: 150
   - Sustained duration: 10 minutes ✓
   - Connection drop rate: 0.0% ✓
   - Socket error rate: 0.1% ✓
   - State consistency: 98% ✓

2. Concurrent Lobbies
   - Maximum concurrent lobbies: 10
   - Players per lobby: 150
   - Total system capacity: 1,500 concurrent players
   - Cross-lobby isolation: ✓
   - Performance degradation: None observed

3. Connection Churn
   - Cycles tested: 20 per player
   - Players: 100
   - Total connections made: 2,000
   - Graceful close rate: 95% ✓
   - Memory leak detected: No ✓

PRODUCTION READY: Yes
RECOMMENDED LIMITS:
- Max players per lobby: 150
- Max concurrent lobbies: 8-10
- Total system capacity: 1,200-1,500 players
```

---

## Quick Reference: All Test Commands

```bash
# Capacity sweep (finds breaking point)
pnpm run loadtest:lobby-capacity:sweep

# Sustained capacity test
pnpm run loadtest:capacity-sustained

# Concurrent lobbies test
pnpm run loadtest:concurrent-lobbies

# Connection churn test
pnpm run loadtest:connection-churn

# Full game simulation
pnpm run loadtest:ws

# Basic capacity test
pnpm run loadtest:lobby-capacity
```

---

## Interpreting Metrics

### Green ✓ (Passed thresholds)
- Good to scale up or maintain current level
- Monitor but not a blocker

### Red ✗ (Failed thresholds)
- May need to reduce load or debug server
- Investigate logs for bottleneck
- Could indicate capacity limit found

### Key metrics by test:

**capacity-sustained:**
- `_ws_upgrade_rate` > 0.99 = Connections working
- `_socket_error_rate` < 0.01 = Stable connections
- `_state_received_rate` > 0.95 = State consistency

**concurrent-lobbies:**
- `_join_accepted_rate` > 0.95 = Capacity allowing joins
- `_socket_error_rate` < 0.05 = Handling load
- Look at gauge `_connections_per_lobby` to verify distribution

**connection-churn:**
- `_graceful_close_rate` > 0.90 = Clean disconnects
- `_socket_error_rate` < 0.10 = Tolerating churn (higher is OK)
- Any memory growth?

---

## Next Actions

1. **Run Phase 1:** Determine max player capacity per lobby
2. **Document results:** Save metrics for baseline comparison
3. **Run Phase 2-3:** Establish concurrent lobby limits
4. **Run Phase 4:** Verify churn/stability
5. **Monitor production:** Use these limits as guardrails
6. **Automate:** Add to CI/CD to detect regressions

See [LOAD_TESTING.md](/Users/loveakinlesi/Projects/umati-monorepo/apps/ws-server/LOAD_TESTING.md) for detailed documentation.
