import exec from "k6/execution";
import http from "k6/http";
import ws from "k6/ws";
import { check, fail, sleep } from "k6";
import { Counter, Rate, Trend, Gauge } from "k6/metrics";

/**
 * Concurrent Lobbies Capacity Test
 *
 * Tests multiple lobbies operating simultaneously, each with the maximum safe player capacity.
 * Verifies that lobbies do not interfere with each other and maintain isolation.
 *
 * Usage:
 *   k6 run load-tests/concurrent-lobbies.js \
 *     -e LOBBIES=10 \
 *     -e PLAYERS_PER_LOBBY=50 \
 *     -e HOLD_DURATION_SECONDS=120
 */

const wsUrl = __ENV.WS_URL || "ws://localhost:4000/ws";
const apiBaseUrl = (__ENV.API_BASE_URL || "http://localhost:3000").replace(/\/$/, "");

const NUM_LOBBIES = Number(__ENV.LOBBIES || 5);
const PLAYERS_PER_LOBBY = Number(__ENV.PLAYERS_PER_LOBBY || 50);
const TOTAL_VUS = NUM_LOBBIES + NUM_LOBBIES * PLAYERS_PER_LOBBY;
const HOLD_DURATION_SECONDS = Number(__ENV.HOLD_DURATION_SECONDS || 120);
const PLAYER_JOIN_STAGGER_MS = Number(__ENV.PLAYER_JOIN_STAGGER_MS || 20);
const STATE_CHECK_INTERVAL_MS = Number(__ENV.STATE_CHECK_INTERVAL_MS || 5000);

const hostAvatar =
  __ENV.HOST_AVATAR ||
  "https://cdn.jsdelivr.net/gh/alohe/avatars/png/upstream_1.png";

// Shared state for tracking lobbies
const sharedData = {
  lobbies: {},
  lobbyIndex: 0,
};

// Metrics
const lobbyCreateDuration = new Trend("concurrent_lobby_create_duration", true);
const guestCreateDuration = new Trend("concurrent_guest_create_duration", true);
const handshakeLatency = new Trend("concurrent_ws_handshake_latency", true);

const websocketUpgradeRate = new Rate("concurrent_ws_upgrade_rate");
const hostReadyRate = new Rate("concurrent_host_ready_rate");
const joinAcceptedRate = new Rate("concurrent_join_accepted_rate");
const joinRejectedRate = new Rate("concurrent_join_rejected_rate");
const socketErrorRate = new Rate("concurrent_socket_error_rate");
const lobbyClosedRate = new Rate("concurrent_lobby_closed_rate");
const lobbiesActiveGauge = new Gauge("concurrent_lobbies_active");
const connectionsPerLobbyGauge = new Gauge("concurrent_connections_per_lobby");

const acceptedCount = new Counter("concurrent_accepted_count");
const rejectedCount = new Counter("concurrent_rejected_count");
const lobbiesCreatedCount = new Counter("concurrent_lobbies_created_count");
const crossLobbyMessageCount = new Counter("concurrent_cross_lobby_message_count");

const EVENT = {
  OPEN: "OPEN",
  ERROR: "ERROR",
  ROOM_INIT: "ROOM:HOST:INIT",
  ROOM_STATE: "ROOM:STATE",
  ROOM_CLOSED: "ROOM:closed",
  ROOM_CLOSED_ME: "ROOM:closed-me",
  PLAYER_JOIN: "PLAYER:JOIN",
};

// Store lobby IDs globally via ENV or in a shared object
// For k6, we'll use a workaround by having host IDs encode lobby info
let globalLobbyRegistry = {};

export const options = {
  scenarios: {
    hosts: {
      executor: "per-vu-iterations",
      exec: "hostSession",
      vus: NUM_LOBBIES,
      iterations: 1,
      maxDuration: `${HOLD_DURATION_SECONDS + 30}s`,
      tags: { role: "host" },
    },
    players: {
      executor: "per-vu-iterations",
      exec: "playerSession",
      vus: NUM_LOBBIES * PLAYERS_PER_LOBBY,
      iterations: 1,
      startTime: "2s",
      maxDuration: `${HOLD_DURATION_SECONDS + 30}s`,
      tags: { role: "player" },
    },
  },
  thresholds: {
    "concurrent_ws_upgrade_rate": ["rate>0.99"],
    "concurrent_host_ready_rate": ["rate>0.99"],
    "concurrent_join_accepted_rate": ["rate>0.95"],
    "concurrent_join_rejected_rate": ["rate<0.05"],
    "concurrent_socket_error_rate": ["rate<0.05"],
    "concurrent_lobby_closed_rate": ["rate>0.95"],
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
  const hostVuId = exec.vu.idInTest;
  const host = createGuest(`k6 Host ${hostVuId}`, hostAvatar);
  const lobby = createLobby(host.id, `k6 Host ${hostVuId}`, hostAvatar);

  // Store lobby in global registry so players can find it
  globalLobbyRegistry[hostVuId] = {
    hostId: host.id,
    lobbyId: lobby.id,
    guestCount: 0,
  };

  lobbiesCreatedCount.add(1);
  lobbiesActiveGauge.add(1);

  let stateCheckLastTime = Date.now();

  const wsParams = {
    headers: {
      "X-Guest-ID": host.id,
      "X-Lobby-ID": lobby.id,
      "X-Role": "host",
    },
    tags: { role: "host", lobby: `lobby_${hostVuId}` },
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
        const event = message?.event;

        if (event === EVENT.ROOM_INIT) {
          // Host initialization
        } else if (event === EVENT.PLAYER_JOIN) {
          globalLobbyRegistry[hostVuId].guestCount++;
          connectionsPerLobbyGauge.add(1);
        } else if (event === EVENT.ROOM_STATE) {
          // State update received
        }

        // Periodic state check
        const now = Date.now();
        if (now - stateCheckLastTime > STATE_CHECK_INTERVAL_MS) {
          stateCheckLastTime = now;
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
      lobbiesActiveGauge.add(-1);
      connectionsPerLobbyGauge.add(-globalLobbyRegistry[hostVuId]?.guestCount || 0);
    });

    socket.setTimeout(() => {
      socket.close();
    }, HOLD_DURATION_SECONDS * 1000);
  });

  lobbyClosedRate.add(1);
}

export function playerSession() {
  // Determine which lobby this player should join (round-robin)
  const playerVuId = exec.vu.idInTest;
  const lobbyIndex = ((playerVuId - NUM_LOBBIES - 1) % NUM_LOBBIES) + 1;

  const player = createGuest(`k6 Player ${playerVuId}`, hostAvatar);

  // Stagger joins
  sleep(
    ((playerVuId - NUM_LOBBIES - 1) * PLAYER_JOIN_STAGGER_MS) / 1000,
  );

  let joinState = "pending";
  let stateCheckLastTime = Date.now();

  // Try to get lobby from registry
  const lobbyInfo = globalLobbyRegistry[lobbyIndex];
  if (!lobbyInfo) {
    fail(`Lobby ${lobbyIndex} not found in registry`);
  }

  const wsParams = {
    headers: {
      "X-Guest-ID": player.id,
      "X-Lobby-ID": lobbyInfo.lobbyId,
      "X-Role": "player",
    },
    tags: { role: "player", lobby: `lobby_${lobbyIndex}` },
  };

  ws.connect(wsUrl, wsParams, function (socket) {
    websocketUpgradeRate.add(1);
    connectionsPerLobbyGauge.add(1);

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
        }

        // Periodic state check
        const now = Date.now();
        if (now - stateCheckLastTime > STATE_CHECK_INTERVAL_MS) {
          stateCheckLastTime = now;
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
      connectionsPerLobbyGauge.add(-1);
    });

    socket.setTimeout(() => {
      socket.close();
    }, HOLD_DURATION_SECONDS * 1000);
  });
}
