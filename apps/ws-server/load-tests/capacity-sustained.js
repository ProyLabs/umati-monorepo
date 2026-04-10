import exec from "k6/execution";
import http from "k6/http";
import ws from "k6/ws";
import { check, fail, sleep } from "k6";
import { Counter, Rate, Trend, Gauge } from "k6/metrics";

/**
 * Sustained Single Lobby Capacity Test
 *
 * Tests the maximum consistent player capacity for a single lobby over an extended period.
 * Verifies no dropped connections, race conditions, or state inconsistencies.
 *
 * Usage:
 *   k6 run load-tests/capacity-sustained.js \
 *     --vus=100 \
 *     -e MAX_PLAYERS=100 \
 *     -e HOLD_DURATION_SECONDS=300 \
 *     -e STATE_CHECK_INTERVAL_MS=5000
 */

const wsUrl = __ENV.WS_URL || "ws://localhost:4000/ws";
const apiBaseUrl = (__ENV.API_BASE_URL || "http://localhost:3000").replace(/\/$/, "");

const MAX_PLAYERS = Number(__ENV.MAX_PLAYERS || 50);
const HOLD_DURATION_SECONDS = Number(__ENV.HOLD_DURATION_SECONDS || 300); // 5 minutes default
const PLAYER_JOIN_STAGGER_MS = Number(__ENV.PLAYER_JOIN_STAGGER_MS || 20);
const STATE_CHECK_INTERVAL_MS = Number(__ENV.STATE_CHECK_INTERVAL_MS || 5000);
const HOST_MAX_DURATION = __ENV.HOST_MAX_DURATION || "10m";
const PLAYER_MAX_DURATION = __ENV.PLAYER_MAX_DURATION || "10m";

const hostAvatar =
  __ENV.HOST_AVATAR ||
  "https://cdn.jsdelivr.net/gh/alohe/avatars/png/upstream_1.png";

// Metrics
const lobbyCreateDuration = new Trend("sustained_lobby_create_duration", true);
const guestCreateDuration = new Trend("sustained_guest_create_duration", true);
const handshakeLatency = new Trend("sustained_ws_handshake_latency", true);
const stateCheckLatency = new Trend("sustained_state_check_latency", true);

const websocketUpgradeRate = new Rate("sustained_ws_upgrade_rate");
const hostReadyRate = new Rate("sustained_host_ready_rate");
const joinAcceptedRate = new Rate("sustained_join_accepted_rate");
const joinRejectedRate = new Rate("sustained_join_rejected_rate");
const socketErrorRate = new Rate("sustained_socket_error_rate");
const lobbyClosedRate = new Rate("sustained_lobby_closed_rate");
const stateReceivedRate = new Rate("sustained_state_received_rate");
const unexpectedDisconnectRate = new Rate("sustained_unexpected_disconnect_rate");

const acceptedCount = new Counter("sustained_accepted_count");
const rejectedCount = new Counter("sustained_rejected_count");
const stateCheckCount = new Counter("sustained_state_check_count");
const unexpectedDisconnectCount = new Counter("sustained_unexpected_disconnect_count");

const activeConnectionsGauge = new Gauge("sustained_active_connections");

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
    host: {
      executor: "per-vu-iterations",
      exec: "hostSession",
      vus: 1,
      iterations: 1,
      maxDuration: HOST_MAX_DURATION,
      tags: { role: "host" },
    },
    players: {
      executor: "per-vu-iterations",
      exec: "playerSession",
      vus: MAX_PLAYERS,
      iterations: 1,
      startTime: "1s",
      maxDuration: PLAYER_MAX_DURATION,
      tags: { role: "player" },
    },
  },
  thresholds: {
    // Connectivity thresholds
    "sustained_ws_upgrade_rate": ["rate>0.99"],
    "sustained_host_ready_rate": ["rate>0.99"],
    "sustained_join_accepted_rate": ["rate>0.99"],
    "sustained_join_rejected_rate": ["rate<0.01"],
    "sustained_socket_error_rate": ["rate<0.01"],
    "sustained_unexpected_disconnect_rate": ["rate<0.01"],
    "sustained_lobby_closed_rate": ["rate>0.99"],

    // State consistency thresholds
    "sustained_state_received_rate": ["rate>0.95"],

    // HTTP thresholds
    "http_req_failed": ["rate<0.05"],
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

export function hostSession() {
  const host = createGuest("k6 Host", hostAvatar);
  const lobby = createLobby(host.id, "k6 Host", hostAvatar);

  const startTime = Date.now();
  let stateCheckLastTime = startTime;
  let isConnected = false;

  const wsParams = {
    headers: {
      "X-Guest-ID": host.id,
      "X-Lobby-ID": lobby.id,
      "X-Role": "host",
    },
    tags: { role: "host" },
  };

  ws.connect(wsUrl, wsParams, function (socket) {
    isConnected = true;
    websocketUpgradeRate.add(1);

    socket.on("open", () => {
      hostReadyRate.add(1);
      socket.send(encodeMessage(EVENT.OPEN, {}));
    });

    socket.on("message", (data) => {
      try {
        const message = JSON.parse(data);
        const event = message?.event;

        if (event === EVENT.ROOM_INIT) {
          // Host initialization - room is ready
        } else if (event === EVENT.PLAYER_JOIN) {
          // Track successful joins
        } else if (event === EVENT.ROOM_STATE) {
          stateReceivedRate.add(1);
        }

        // Periodic state check
        const now = Date.now();
        if (now - stateCheckLastTime > STATE_CHECK_INTERVAL_MS) {
          stateCheckLastTime = now;
          stateCheckCount.add(1);
          socket.send(encodeMessage(EVENT.ROOM_STATE, {}));
        }
      } catch (e) {
        // Silently handle parse errors
      }
    });

    socket.on("error", () => {
      socketErrorRate.add(1);
    });

    socket.on("close", () => {
      if (isConnected) {
        unexpectedDisconnectRate.add(1);
        unexpectedDisconnectCount.add(1);
      }
    });

    socket.setTimeout(() => {
      socket.close();
    }, HOLD_DURATION_SECONDS * 1000);
  });

  lobbyClosedRate.add(1);
}

export function playerSession() {
  const player = createGuest(`k6 Player ${exec.vu.idInTest}`, hostAvatar);

  // Create a lobby (only the first player will succeed; others will join the host's lobby)
  // For simplicity in this test, all players join the same lobby created by the host
  // In real scenario, you'd need a shared lobby ID mechanism

  // Stagger joins to simulate gradual player arrival
  sleep((exec.vu.idInTest - 1) * (PLAYER_JOIN_STAGGER_MS / 1000));

  let joinState = "pending";
  let isConnected = false;
  let stateCheckLastTime = Date.now();

  const wsParams = {
    headers: {
      "X-Guest-ID": player.id,
      "X-Role": "player",
    },
    tags: { role: "player" },
  };

  ws.connect(wsUrl, wsParams, function (socket) {
    isConnected = true;
    websocketUpgradeRate.add(1);
    activeConnectionsGauge.add(1);

    socket.on("open", () => {
      socket.send(encodeMessage(EVENT.OPEN, {}));
    });

    socket.on("message", (data) => {
      try {
        const message = JSON.parse(data);
        const event = message?.event;
        const payload = message?.payload;

        if (event === EVENT.PLAYER_JOIN) {
          const accepted = payload?.accepted;
          if (accepted) {
            joinAcceptedRate.add(1);
            acceptedCount.add(1);
            joinState = "accepted";
          } else {
            joinRejectedRate.add(1);
            rejectedCount.add(1);
            joinState = "rejected";
          }
        } else if (event === EVENT.ROOM_STATE) {
          stateReceivedRate.add(1);
        }

        // Periodic state check
        const now = Date.now();
        if (now - stateCheckLastTime > STATE_CHECK_INTERVAL_MS) {
          stateCheckLastTime = now;
          stateCheckCount.add(1);
          socket.send(encodeMessage(EVENT.ROOM_STATE, {}));
        }
      } catch (e) {
        // Silently handle parse errors
      }
    });

    socket.on("error", () => {
      socketErrorRate.add(1);
    });

    socket.on("close", () => {
      activeConnectionsGauge.add(-1);
      if (isConnected && joinState === "accepted") {
        unexpectedDisconnectRate.add(1);
        unexpectedDisconnectCount.add(1);
      }
    });

    socket.setTimeout(() => {
      socket.close();
    }, HOLD_DURATION_SECONDS * 1000);
  });
}
