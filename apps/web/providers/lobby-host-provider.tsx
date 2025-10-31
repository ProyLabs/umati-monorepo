"use client";

import {
  Game,
  getWsUrl,
  Lobby,
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

/**
 * 🎮 Host Lobby Context
 */
interface LobbyHostContextType {
  lobby: Lobby | null;
  players: Player[];
  reactions: Record<string, string | null>; // playerId → emoji
  loading: boolean;
  uiState: RoomState["uiState"];
  gameState: RoomState["gameState"];
  joinUrl: string;
  rankings: Ranking[];
  game: Game|null;

  changeUiState: (state: RoomState["uiState"]) => void;
  sendAnnouncement: (message: string) => void;
  kickPlayer: (playerId: string, reason?: string) => void;
  closeLobby: () => void;
  startGame: () => void;
  setupGame: (gameId: string, options: any) => void;
}

/**
 * 🧩 Context
 */
const LobbyHostContext = createContext<LobbyHostContextType | undefined>(
  undefined
);

/**
 * 🏠 Provider Component
 */
export function LobbyHostProvider({ children }: { children: ReactNode }) {
  const { identifier } = useParams() as { identifier: string };
  const router = useRouter();

  const [lobby, setLobby] = useState<Lobby | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [reactions, setReactions] = useState<Record<string, string | null>>({});
  const [uiState, setUiState] = useState<RoomState["uiState"]>("INIT");
  const [gameState, setGameState] = useState<RoomState["gameState"]>("BEFORE");
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [game, setGame] = useState<Game|null>(null);

  const wsRef = useRef<WSClient | null>(null);


  // --------------------------------------------------------------------------
  // ⚡ WebSocket event handling
  // --------------------------------------------------------------------------
  const handleMessage = useCallback(
    (event: WSEvent, payload: any) => {
      console.log("🚀 ~ LobbyHostProvider ~ event:", event);
      switch (event) {
        case WSEvent.OPEN:
          console.log("✅ Host WS connected");
          wsRef.current?.send(WSEvent.ROOM_INIT, { roomId: identifier });
          break;

        case WSEvent.ROOM_STATE:
          const data = payload as WSPayloads[WSEvent.ROOM_STATE];
          (setLobby(data), setPlayers(data.players));
          setUiState(data.state.uiState);
          setGameState(data.state.gameState);
          setRankings(data.rankings ?? []);
          setGame(data.game);
          setLoading(false);
          break;

        case WSEvent.PLAYER_JOIN:
          toast.success(`${payload?.displayName} joined the lobby`);
          break;

        // case WSEvent.PLAYER_LEFT:
        //   console.log("🚀 ~ LobbyHostProvider ~ players:", players);
        //   // removePlayer(payload.playerId);
        //   setPlayers((prev) => prev.filter((p) => p.playerId !== payload.playerId));
        //   break;

        case WSEvent.PLAYER_REACTION:
          setReactions((prev) => ({
            ...prev,
            [payload.playerId]: payload.emoji,
          }));
          setTimeout(() => {
            setReactions((prev) => ({ ...prev, [payload.playerId]: null }));
          }, 3000);
          break;

        // case WSEvent.PLAYER_KICKED:
        //   toast.info(`Player ${payload.playerId} was kicked`);
        //   setPlayers((prev) =>
        //     prev.filter((p) => p.playerId !== payload.playerId)
        //   );
        //   break;

        case WSEvent.GAME_QUESTION:
          // setUiState("GAME");
          break;

        case WSEvent.GAME_ROUND_ENDED:
          // setUiState("LEADERBOARD");
          break;

        case WSEvent.ROOM_CLOSED:
          toast.info(payload.reason);
          router.replace("/");
          break;

        default:
          console.log("📩 Unhandled event:", event, payload);
          break;
      }
    },
    [router]
  );

  // --------------------------------------------------------------------------
  // 🔌 WebSocket connection setup
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!identifier) return;

    const wsUrl = getWsUrl();
    const ws = new WSClient(wsUrl);
    wsRef.current = ws;

    ws.onConnectionChange((state) => {
      if (state === "open") console.log("✅ Host WS connected");
      if (state === "reconnecting") toast.info("Reconnecting...");
      if (state === "closed") toast.error("WS disconnected");
    });

    // Register handlers
    ws.on(WSEvent.OPEN, (p) => handleMessage(WSEvent.OPEN, p));
    ws.on(WSEvent.ROOM_STATE, (p) => handleMessage(WSEvent.ROOM_STATE, p));
    ws.on(WSEvent.ROOM_CLOSED, (p) => handleMessage(WSEvent.ROOM_CLOSED, p));

    ws.on(WSEvent.PLAYER_JOIN, (p) => handleMessage(WSEvent.PLAYER_JOIN, p));
    // ws.on(WSEvent.PLAYER_LEFT, (p) => handleMessage(WSEvent.PLAYER_LEFT, p));
    ws.on(WSEvent.PLAYER_REACTION, (p) =>
      handleMessage(WSEvent.PLAYER_REACTION, p)
    );
    ws.on(WSEvent.PLAYER_KICKED, (p) =>
      handleMessage(WSEvent.PLAYER_KICKED, p)
    );
    ws.on(WSEvent.GAME_QUESTION, (p) =>
      handleMessage(WSEvent.GAME_QUESTION, p)
    );
    ws.on(WSEvent.GAME_ROUND_ENDED, (p) =>
      handleMessage(WSEvent.GAME_ROUND_ENDED, p)
    );

    return () => {
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, []);

  // --------------------------------------------------------------------------
  // 🧩 Derived values
  // --------------------------------------------------------------------------

  const joinUrl = useMemo(() => {
    if (!lobby) return "";
    if (typeof window === "undefined") return "";
    // ✅ Use your Next.js route convention here
    return `${window.location.origin}/lobby/${lobby.id}`;
  }, [lobby]);

  // --------------------------------------------------------------------------
  // 🎮 Host Actions
  // --------------------------------------------------------------------------
  const setupGame = useCallback((gameId: string, options: any) => {
    wsRef.current?.send(WSEvent.GAME_INIT, {
      roomId: identifier,
      options,
    });
  }, []);

  const startGame = useCallback(() => {
    wsRef.current?.send(WSEvent.GAME_START, {
      roomId: identifier,
    });
  }, []);

  const changeUiState = useCallback((uiState: RoomState["uiState"]) => {
    wsRef.current?.send(WSEvent.ROOM_STATE_CHANGE, {
      roomId: identifier,
      state: { uiState },
    });
  }, []);

  const sendAnnouncement = useCallback((message: string) => {
    wsRef.current?.send(WSEvent.SYSTEM_ANNOUNCEMENT, {
      message,
      level: "info",
    });
  }, []);

  const kickPlayer = useCallback((playerId: string, reason?: string) => {
    wsRef.current?.send(WSEvent.PLAYER_KICKED, { playerId, reason });
  }, []);

  const closeLobby = useCallback(() => {
    wsRef.current?.send(WSEvent.ROOM_CLOSED_ME, {
      roomId: identifier,
      reason: "Host closed lobby",
    });
  }, [identifier, router]);

  // --------------------------------------------------------------------------
  // 💾 Context Value
  // --------------------------------------------------------------------------

  const value = useMemo(
    () => ({
      lobby,
      players,
      reactions,
      loading,
      uiState,
      gameState,
      joinUrl,
      rankings,
      game,
      changeUiState,
      sendAnnouncement,
      kickPlayer,
      closeLobby,
      startGame,
      setupGame,
    }),
    [
      lobby,
      players,
      reactions,
      loading,
      uiState,
      gameState,
      joinUrl,
      rankings,
      game,
      changeUiState,
      sendAnnouncement,
      kickPlayer,
      closeLobby,
      startGame,
      setupGame,
    ]
  );

  return (
    <LobbyHostContext.Provider value={value}>
      {children}
    </LobbyHostContext.Provider>
  );
}

/**
 * 🪄 Hook to use host lobby context
 */
export function useLobbyHost() {
  const ctx = useContext(LobbyHostContext);
  if (!ctx)
    throw new Error("useLobbyHost must be used within a LobbyHostProvider");
  return ctx;
}
