"use client";

import {
  Game,
  GameLobbyMeta,
  GameType,
  getWsUrl,
  Lobby,
  LobbyPoll,
  Player,
  Ranking,
  RoomState,
  WSClient,
  WSEvent,
  WSPayloads,
} from "@umati/ws";
import { useParams, useRouter } from "next/navigation";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";

/* -------------------------------------------------------------------------- */
/* 🎮 Context Type                                                           */
/* -------------------------------------------------------------------------- */

interface LobbyHostContextType {
  lobby: Lobby | null;
  players: Player[];
  reactions: Record<string, string | null>;
  loading: boolean;
  reconnecting: boolean; // 👈 new
  uiState: RoomState;
  joinUrl: string;
  rankings: Ranking[];
  game: GameLobbyMeta | null;
  poll: LobbyPoll | null;

  wsClient: WSClient | null;

  changeUiState: (state: RoomState) => void;
  sendAnnouncement: (message: string) => void;
  kickPlayer: (playerId: string, reason?: string) => void;
  closeLobby: () => void;
  startGame: () => void;
  cancelGame: () => void;
  setupGame: (gameId: GameType, options: any) => void;
  startPoll: (
    question: string,
    options: string[],
    allowMultiple: boolean,
  ) => void;
  endPoll: () => void;
}

const LobbyHostContext = createContext<LobbyHostContextType | undefined>(
  undefined
);

/* -------------------------------------------------------------------------- */
/* 🏠 Provider                                                                */
/* -------------------------------------------------------------------------- */

export function LobbyHostProvider({ children }: { children: ReactNode }) {
  const { identifier } = useParams() as { identifier: string };
  const router = useRouter();

  const [lobby, setLobby] = useState<Lobby | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [reactions, setReactions] = useState<Record<string, string | null>>({});
  const [uiState, setUiState] = useState<RoomState>("INIT");
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [game, setGame] = useState<GameLobbyMeta | null>(null);
  const [poll, setPoll] = useState<LobbyPoll | null>(null);
  const [reconnecting, setReconnecting] = useState(false); // 👈 new

  const wsRef = useRef<WSClient | null>(null);
  const initializedRef = useRef(false);

  /* ------------------------------------------------------------------------ */
  /* ⚡ Event Handling                                                        */
  /* ------------------------------------------------------------------------ */
  const handleMessage = useCallback(
    (event: WSEvent, payload: any) => {
      switch (event) {
        // case WSEvent.NOT_FOUND:
        //   router.push("/not-found");
        //   break;

        case WSEvent.OPEN:
          console.log("✅ Host WS connected");
          setReconnecting(false);
          wsRef.current?.send(WSEvent.ROOM_INIT, { roomId: identifier });
          break;

        case WSEvent.ROOM_STATE: {
          const data = payload as WSPayloads[WSEvent.ROOM_STATE];
          if (!data) return;
          setLobby(data);
          setPlayers(data.players);
          setUiState(data.state);
          setRankings(data.rankings ?? []);
          setGame(data.game ?? null);
          setPoll(data.poll ?? null);
          setLoading(false);
          break;
        }

        case WSEvent.POLL_STATE:
          setPoll(payload.poll ?? null);
          break;

        case WSEvent.ERROR:
          toast.error(payload.message ?? "Something went wrong", {
            position: "bottom-right",
          });
          break;

        case WSEvent.PLAYER_JOIN:
          toast.success(`${payload?.displayName} joined the lobby`, {
            position: "bottom-right",
          });
          break;
        case WSEvent.PLAYER_LEAVE:
          console.log("📤 Player left:", payload);
          toast.success(`${payload?.displayName} left the lobby`, {
            position: "bottom-right",
          });
          break;

        case WSEvent.PLAYER_KICKED:
          toast.success("Player removed from the lobby", {
            position: "bottom-right",
          });
          break;

        case WSEvent.PLAYER_REACTION:
          setReactions((prev) => ({
            ...prev,
            [payload.playerId]: payload.emoji,
          }));
          setTimeout(() => {
            setReactions((prev) => ({ ...prev, [payload.playerId]: null }));
          }, 3000);
          break;

        case WSEvent.ROOM_CLOSED:
          toast.info(payload.reason ?? "Lobby closed");
          router.replace("/");
          break;

        default:
          console.log("📩 Unhandled event:", event, payload);
          break;
      }
    },
    [identifier, router]
  );

  /* ------------------------------------------------------------------------ */
  /* 🔌 WebSocket Setup + Reconnect Handling                                 */
  /* ------------------------------------------------------------------------ */
  useEffect(() => {
    if (!identifier) return;
    if (initializedRef.current) {
      console.log("⚠️ WS already initialized — skipping");
      return;
    }

    initializedRef.current = true;
    console.log("🔌 Initializing WS connection for host:", identifier);

    const ws = new WSClient(getWsUrl());
    wsRef.current = ws;

    ws.onConnectionChange((state) => {
      switch (state) {
        case "open":
          setReconnecting(false);
          // console.log("✅ WS open");
          break;
        case "reconnecting":
          // if (!reconnecting) toast.info("Reconnecting...");
          setReconnecting(true);
          break;
        case "closed":
          setReconnecting(false);
          // toast.error("WS disconnected");
          break;
      }
    });

    const events: WSEvent[] = [
      WSEvent.OPEN,
      WSEvent.ROOM_STATE,
      WSEvent.ROOM_CLOSED,
      WSEvent.PLAYER_JOIN,
      WSEvent.PLAYER_LEAVE,
      WSEvent.PLAYER_REACTION,
      WSEvent.PLAYER_KICKED,
      WSEvent.POLL_STATE,
      WSEvent.ERROR,
    ];
    for (const ev of events)
      ws.on(ev as keyof WSPayloads, (payload) => handleMessage(ev, payload));

    return () => {
      console.log("🧹 Cleaning up WS connection");
      initializedRef.current = false;
      ws.close();
      wsRef.current = null;
    };
  }, [identifier, handleMessage, reconnecting]);

  /* ------------------------------------------------------------------------ */
  /* 🧩 Derived Values                                                       */
  /* ------------------------------------------------------------------------ */
  const joinUrl = useMemo(() => {
    if (!lobby || typeof window === "undefined") return "";
    // return `http://192.168.1.141:3000/lobby/${lobby.id}`;
    return `${window.location.origin}/lobby/${lobby.id}`;
  }, [lobby]);

  /* ------------------------------------------------------------------------ */
  /* 🎮 Host Actions                                                         */
  /* ------------------------------------------------------------------------ */
  const send = useCallback(
    <E extends WSEvent>(
      event: E,
      payload: WSPayloads[E & keyof WSPayloads]
    ) => {
      wsRef.current?.send(event, payload);
    },
    []
  );

  const setupGame = useCallback(
    (gameId: GameType, options: any) =>
      send(WSEvent.GAME_INIT, {
        roomId: identifier,
        options: { type: gameId, config: options },
      }),
    [identifier, send]
  );

  const startGame = useCallback(
    () => send(WSEvent.GAME_START, { roomId: identifier }),
    [identifier, send]
  );

  const cancelGame = useCallback(
    () => send(WSEvent.GAME_CANCEL, { roomId: identifier }),
    [identifier, send]
  );

  const changeUiState = useCallback(
    (state: RoomState) =>
      send(WSEvent.ROOM_STATE_CHANGE, { roomId: identifier, state }),
    [identifier, send]
  );

  const sendAnnouncement = useCallback(
    (message: string) =>
      send(WSEvent.SYSTEM_ANNOUNCEMENT, { message, level: "info" }),
    [send]
  );

  const kickPlayer = useCallback(
    (playerId: string, reason?: string) =>
      send(WSEvent.PLAYER_KICKED, { roomId: identifier, playerId, reason }),
    [identifier, send]
  );

  const closeLobby = useCallback(
    () =>
      send(WSEvent.ROOM_CLOSED_ME, {
        roomId: identifier,
        reason: "Host closed lobby",
      }),
    [identifier, send]
  );

  const startPoll = useCallback(
    (question: string, options: string[], allowMultiple: boolean) =>
      send(WSEvent.POLL_START, {
        roomId: identifier,
        question,
        options,
        allowMultiple,
      }),
    [identifier, send],
  );

  const endPoll = useCallback(
    () => send(WSEvent.POLL_END, { roomId: identifier }),
    [identifier, send],
  );

  /* ------------------------------------------------------------------------ */
  /* 💾 Context Value                                                        */
  /* ------------------------------------------------------------------------ */
  const value = useMemo<LobbyHostContextType>(
    () => ({
      lobby,
      players,
      reactions,
      loading,
      reconnecting, // 👈 new
      uiState,
      joinUrl,
      rankings,
      game,
      poll,
      wsClient: wsRef.current,
      changeUiState,
      sendAnnouncement,
      kickPlayer,
      closeLobby,
      startGame,
      setupGame,
      cancelGame,
      startPoll,
      endPoll,
    }),
    [
      lobby,
      players,
      reactions,
      loading,
      reconnecting,
      uiState,
      joinUrl,
      rankings,
      game,
      poll,
      changeUiState,
      sendAnnouncement,
      kickPlayer,
      closeLobby,
      startGame,
      setupGame,
      cancelGame,
      startPoll,
      endPoll,
    ],
  );

  return (
    <LobbyHostContext.Provider value={value}>
      {children}
    </LobbyHostContext.Provider>
  );
}

/* -------------------------------------------------------------------------- */
/* 🪄 Hook                                                                    */
/* -------------------------------------------------------------------------- */

export function useLobbyHost() {
  const ctx = useContext(LobbyHostContext);
  if (!ctx)
    throw new Error("useLobbyHost must be used within a LobbyHostProvider");
  return ctx;
}
