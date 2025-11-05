"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/providers/auth-provider";
import {
  Lobby,
  Player,
  RoomState,
  WSEvent,
  WSClient,
  WSPayloads,
  getWsUrl,
  Game,
  GameLobbyMeta,
  TriviaOptions,
} from "@umati/ws";

/** Context shape */
interface LobbyPlayerContextType {
  lobby: Lobby | null;
  players: Player[];
  player: Player | null;
  uiState: RoomState;
  game: GameLobbyMeta | null;
  loading: boolean;
  isInLobby: boolean;

  wsClient: WSClient | null;

  // Actions
  joinLobby: (displayName: string, avatar: string) => Promise<void>;
  leaveLobby: () => Promise<void>;
  sendReaction: (emoji: string) => void;
  sendAnswer: (index: TriviaOptions) => void;
}

const LobbyPlayerContext = createContext<LobbyPlayerContextType | undefined>(
  undefined
);

export function LobbyPlayerProvider({ children }: { children: ReactNode }) {
  const { identifier } = useParams() as { identifier: string };
  const router = useRouter();
  const { user, updateUser } = useAuth(); // Always returns a user or guest
  const [lobby, setLobby] = useState<Lobby | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [uiState, setUiState] = useState<RoomState>("INIT");
  const [game, setGame] = useState<GameLobbyMeta | null>(null);

  const wsRef = useRef<WSClient | null>(null);

  // --------------------------------------------------------------------------
  // ⚡ WebSocket event handling
  // --------------------------------------------------------------------------
  const handleMessage = useCallback(
    (event: WSEvent, payload: any) => {
      console.log("🚀 ~ LobbyHostProvider ~ event:", event);
      switch (event) {
        case WSEvent.OPEN:
          console.log(`✅ Player ${user?.id!} WS connected`);
          wsRef.current?.send(WSEvent.PLAYER_CONNECT, {
            roomId: identifier,
            playerId: user?.id!,
          });
          break;

        case WSEvent.ROOM_STATE:
          const data = payload as WSPayloads[WSEvent.ROOM_STATE];
          (setLobby(data), setPlayers(data!.players));
          setUiState(data!.state);
          setGame(data!.game);
          setLoading(false);
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
      if (state === "open") console.log("✅ Player WS connected");
      if (state === "reconnecting") toast.info("Reconnecting...");
      if (state === "closed") toast.error("WS disconnected");
    });

    // Register handlers
    ws.on(WSEvent.OPEN, (p) => handleMessage(WSEvent.OPEN, p));
    ws.on(WSEvent.ROOM_STATE, (p) => handleMessage(WSEvent.ROOM_STATE, p));
    ws.on(WSEvent.ROOM_CLOSED, (p) => handleMessage(WSEvent.ROOM_CLOSED, p));

    return () => {
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, []);

  // --------------------------------------------------------------------------
  // 🧩 Derived values
  // --------------------------------------------------------------------------

  const player = useMemo(() => {
    if (!lobby) return null;
    const player = players.find((p) => p.id === user?.id);
    return player ?? null;
  }, [lobby, players]);

  const isInLobby = useMemo(() => {
    if (!lobby) return false;
    return players.some((p) => p.id === user?.id);
  }, [lobby, players]);

  // Actions
  const joinLobby = async (displayName: string, avatar: string) => {
    updateUser(displayName, avatar);
    wsRef.current?.send(WSEvent.PLAYER_JOIN, {
      roomId: identifier,
      playerId: user?.id!,
      displayName,
      avatar,
    });
  };

  const leaveLobby = async () => {
    wsRef.current?.send(WSEvent.PLAYER_LEAVE, {
      roomId: identifier,
      playerId: user?.id!,
    });
  };

  const sendReaction = async (emoji: string) => {
    wsRef.current?.send(WSEvent.PLAYER_REACTION, {
      roomId: identifier,
      playerId: player?.id!,
      displayName: player?.displayName!,
      emoji,
    });
  };

  const sendAnswer = async (index: 0 | 1 | 2 | 3) => {
    wsRef.current?.send(WSEvent.GAME_ANSWER, {
      roomId: identifier,
      answer: index,
      playerId: player?.id!,
    });
  };

  // --------------------------------------------------------------------------
  // 💾 Context Value
  // --------------------------------------------------------------------------
  const value = useMemo(
    () => ({
      lobby,
      players,
      player,
      uiState,
      game,
      loading,
      isInLobby,
      wsClient: wsRef.current,
      joinLobby,
      leaveLobby,
      sendReaction,
      sendAnswer,
    }),
    [
      lobby,
      players,
      player,
      uiState,
      loading,
      isInLobby,
      game,
      wsRef,
      joinLobby,
      leaveLobby,
      sendReaction,
      sendAnswer,
    ]
  );

  return (
    <LobbyPlayerContext.Provider value={value}>
      {children}
    </LobbyPlayerContext.Provider>
  );
}

/** Hook */
export function useLobbyPlayer() {
  const ctx = useContext(LobbyPlayerContext);
  if (!ctx)
    throw new Error("useLobbyPlayer must be used within a LobbyPlayerProvider");
  return ctx;
}
