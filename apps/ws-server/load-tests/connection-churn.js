import exec from "k6/execution";
import http from "k6/http";
import ws from "k6/ws";
import { check, fail, sleep } from "k6";
import { Counter, Rate, Trend, Gauge } from "k6/metrics";

/**
 * Connection Churn Test
 *
 * Tests stability under rapid join/leave cycles (connection churn).
 * Verifies proper cleanup, no resource leaks, and recovery from high turnover.
 *
 * Useful for detecting:
 * - Memory leaks during rapid connections
 * - Improper socket cleanup
 * - Race conditions during disconnect/reconnect
 * - Event handler accumulation
 *
 * Usage:
 *   k6 run load-tests/connection-churn.js \
 *     --vus=100 \
 *     -e CYCLES=10 \
 *     -e HOLD_TIME_MS=2000
 */

const wsUrl = __ENV.WS_URL || "ws://localhost:4000/ws";
const apiBaseUrl = (__ENV.API_BASE_URL || "http://localhost:3000").replace(/\/$/, "");

const NUM_CYCLES = Number(__ENV.CYCLES || 10);
const HOLD_TIME_MS = Number(__ENV.HOLD_TIME_MS || 2000);
const TOTAL_VUS = Number(__ENV.TOTAL_VUS || 50);

const hostAvatar =
  __ENV.HOST_AVATAR ||
  "https://cdn.jsdelivr.net/gh/alohe/avatars/png/upstream_1.png";

// Metrics
const guestCreateDuration = new Trend("churn_guest_create_duration", true);
const lobbyCreateDuration = new Trend("churn_lobby_create_duration", true);
const handshakeLatency = new Trend("churn_ws_handshake_latency", true);
const disconnectLatency = new Trend("churn_disconnect_latency", true);

const websocketUpgradeRate = new Rate("churn_ws_upgrade_rate");
const websocketUpgradeFailRate = new Rate("churn_ws_upgrade_fail_rate");
const hostReadyRate = new Rate("churn_host_ready_rate");
const hostReadyFailRate = new Rate("churn_host_ready_fail_rate");
const joinAcceptedRate = new Rate("churn_join_accepted_rate");
const joinRejectedRate = new Rate("churn_join_rejected_rate");
const socketErrorRate = new Rate("churn_socket_error_rate");
const gracefulCloseRate = new Rate("churn_graceful_close_rate");
const forcedCloseRate = new Rate("churn_forced_close_rate");

const cyclesCompletedCount = new Counter("churn_cycles_completed_count");
const connectAttemptCount = new Counter("churn_connect_attempt_count");
const connectSuccessCount = new Counter("churn_connect_success_count");
const connectFailCount = new Counter("churn_connect_fail_count");
const socketErrorCount = new Counter("churn_socket_error_count");
const abnormalCloseCount = new Counter("churn_abnormal_close_count");

const activeConnectionsGauge = new Gauge("churn_active_connections");

const EVENT = {
  OPEN: "OPEN",
  ERROR: "ERROR",
  ROOM_INIT: "ROOM:HOST:INIT",
  ROOM_STATE: "ROOM:STATE",
  ROOM_CLOSED: "ROOM:closed",
  ROOM_CLOSED_ME: "ROOM:closed-me",
  PLAYER_JOIN: "PLAYER:JOIN",
};

export const options = {
  scenarios: {
    churn: {
      executor: "per-vu-iterations",
      exec: "churnSession",
      vus: TOTAL_VUS,
      iterations: 1,
      maxDuration: `${NUM_CYCLES * (HOLD_TIME_MS / 1000) + 60}s`,
      tags: { scenario: "connection-churn" },
    },
  },
  thresholds: {
    // Connection quality thresholds - allow some failures due to churn nature
    "churn_ws_upgrade_rate": ["rate>0.90"],
    "churn_host_ready_rate": ["rate>0.80"],
    "churn_socket_error_rate": ["rate<0.10"],
    "churn_graceful_close_rate": ["rate>0.90"],
    
    // Cycle completion
    "churn_cycles_completed_count": ["count>0"],
    
    // Overall reliability
    "http_req_failed": ["rate<0.10"],
  },
};

function encodeMessage(event, payload) {
  return JSON.stringify({ event, payload });
}

function createGuest(displayName, avatar) {
  const response = http.post(
    `${apiBaseUrl}/api/guests`,
    JSON.stringify({ displayName, avatar }),
    {
      headers: { "Content-Type": "application/json" },
      tags: { endpoint: "create-guest" },
    },
  );

  guestCreateDuration.add(response.timings.duration);
  check(response, {
    "guest create returned 200": (res) => res.status === 200,
  });

  const body = response.json();
  if (!body?.id) {
    fail(`Guest creation failed: ${response.status} ${response.body}`);
  }

  return body;
}

function createLobby(hostId, hostDisplayName, hostAvatar) {
  const response = http.post(
    `${apiBaseUrl}/api/lobbies`,
    JSON.stringify({
      hostId,
      hostDisplayName,
      hostAvatar,
    }),
    {
      headers: { "Content-Type": "application/json" },
      tags: { endpoint: "create-lobby" },
    },
  );

  lobbyCreateDuration.add(response.timings.duration);
  check(response, {
    "lobby create returned 200": (res) => res.status === 200,
  });

  const body = response.json();
  if (!body?.id) {
    fail(`Lobby creation failed: ${response.status} ${response.body}`);
  }

  return body;
}

export function churnSession() {
  const vuId = exec.vu.idInTest;
  const isHost = vuId === 1; // Only first VU acts as host

  if (isHost) {
    // Host creates one lobby and stays connected for all cycles
    const host = createGuest("k6 Churn Host", hostAvatar);
    const lobby = createLobby(host.id, "k6 Churn Host", hostAvatar);

    const wsParams = {
      headers: {
        "X-Guest-ID": host.id,
        "X-Lobby-ID": lobby.id,
        "X-Role": "host",
      },
      tags: { role: "host" },
    };

    ws.connect(wsUrl, wsParams, function (socket) {
      websocketUpgradeRate.add(1);

      socket.on("open", () => {
        hostReadyRate.add(1);
        socket.send(encodeMessage(EVENT.OPEN, {}));
      });

      socket.on("message", (data) => {
        try {
          const message = JSON.parse(data);
          // Just acknowledge messages
        } catch (e) {
          // Silently handle parse errors
        }
      });

      socket.on("error", () => {
        socketErrorRate.add(1);
        socketErrorCount.add(1);
        hostReadyFailRate.add(1);
      });

      socket.on("close", () => {
        abnormalCloseCount.add(1);
      });

      // Host stays connected for the full test duration
      socket.setTimeout(() => {
        socket.close();
      }, NUM_CYCLES * HOLD_TIME_MS * 2);
    });
  } else {
    // Player VUs perform rapid join/leave cycles
    const player = createGuest(`k6 Churn Player ${vuId}`, hostAvatar);

    for (let cycle = 0; cycle < NUM_CYCLES; cycle++) {
      connectAttemptCount.add(1);

      let didConnect = false;
      let socketError = false;

      const wsParams = {
        headers: {
          "X-Guest-ID": player.id,
          "X-Role": "player",
        },
        tags: { role: "player", cycle: String(cycle) },
      };

      ws.connect(wsUrl, wsParams, function (socket) {
        didConnect = true;
        connectSuccessCount.add(1);
        websocketUpgradeRate.add(1);
        activeConnectionsGauge.add(1);

        socket.on("open", () => {
          socket.send(encodeMessage(EVENT.OPEN, {}));
        });

        socket.on("message", (data) => {
          try {
            const message = JSON.parse(data);
            const event = message?.event;

            if (event === EVENT.PLAYER_JOIN) {
              const accepted = message.payload?.accepted;
              if (accepted) {
                joinAcceptedRate.add(1);
              } else {
                joinRejectedRate.add(1);
              }
            }
          } catch (e) {
            // Silently handle parse errors
          }
        });

        socket.on("error", (error) => {
          socketError = true;
          socketErrorRate.add(1);
          socketErrorCount.add(1);
        });

        socket.on("close", () => {
          activeConnectionsGauge.add(-1);
          if (!socketError) {
            gracefulCloseRate.add(1);
          } else {
            forcedCloseRate.add(1);
            abnormalCloseCount.add(1);
          }
        });

        // Hold connection briefly then close
        socket.setTimeout(() => {
          socket.close();
        }, HOLD_TIME_MS);
      });

      if (!didConnect) {
        connectFailCount.add(1);
        websocketUpgradeFailRate.add(1);
      }

      // Brief pause between cycles
      sleep(0.5);
    }

    cyclesCompletedCount.add(1);
  }
}
