"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  FriendFactsRound,
  FriendFactsSetupState,
  GameState,
  Scores,
  WSEvent,
} from "@umati/ws";
import { useLobbyHost } from "@/providers/lobby-host-provider";


interface FriendFactsHostContextType {
  gameId: string | null;
  gameType: string | null;
  state: GameState;
  setup?: FriendFactsSetupState;
  round?: FriendFactsRound | null;
  scores: Scores;
  counts?: Record<string, number>;
  startRound: () => void;
  nextRound: () => void;
}

const FriendFactsHostContext = createContext<FriendFactsHostContextType | null>(
  null,
);

export const FriendFactsHostProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { wsClient, lobby, cancelGame } = useLobbyHost();
  const [gameId, setGameId] = useState<string | null>(lobby?.game?.id ?? null);
  const [gameType, setGameType] = useState<string | null>(
    lobby?.game?.type ?? null,
  );
  const [state, setState] = useState<GameState>("BEFORE");
  const [setup, setSetup] = useState<FriendFactsSetupState | undefined>();
  const [round, setRound] = useState<FriendFactsRound | null>(null);
  const [scores, setScores] = useState<Scores>([]);
  const [counts, setCounts] = useState<Record<string, number> | undefined>();

  useEffect(() => {
    if (!wsClient) return;

    const handleGameState = (payload: any) => {
      setGameId(payload.id);
      setGameType(payload.type);
      setState(payload.state);
      setRound((payload.round as FriendFactsRound) ?? null);
      setScores(payload.scores ?? []);
      setCounts(payload.counts);
    };

    const handleSetupUpdate = ({ state, setup }: any) => {
      setState(state);
      setSetup(setup);
      setRound(null);
    };

    const handleRoundStart = ({ state, round }: any) => {
      setState(state);
      setRound(round);
      setCounts(undefined);
    };

    const handleRoundEnd = ({ state, round, scores, counts }: any) => {
      setState(state);
      setRound(round);
      setScores(scores ?? []);
      setCounts(counts);
    };

    wsClient.on(WSEvent.GAME_STATE, handleGameState);
    wsClient.on(WSEvent.FF_SETUP_UPDATE, handleSetupUpdate);
    wsClient.on(WSEvent.FF_ROUND_START, handleRoundStart);
    wsClient.on(WSEvent.FF_ROUND_END, handleRoundEnd);

    return () => {
      wsClient.off(WSEvent.GAME_STATE, handleGameState);
      wsClient.off(WSEvent.FF_SETUP_UPDATE, handleSetupUpdate);
      wsClient.off(WSEvent.FF_ROUND_START, handleRoundStart);
      wsClient.off(WSEvent.FF_ROUND_END, handleRoundEnd);
    };
  }, [wsClient]);

  const nextRound = () => {
    if (state === GameState.RANKING) {
      cancelGame();
      return;
    }

    if (!wsClient || !lobby) return;
    const nextState =
      state === GameState.ROUND_END
        ? GameState.LEADERBOARD
        : state === GameState.LEADERBOARD
          ? round && round.number >= round.totalRounds
            ? GameState.RANKING
            : GameState.ROUND
          : null;

    if (!nextState) return;
    wsClient.send(WSEvent.GAME_STATE_CHANGE, {
      roomId: lobby.id,
      state: nextState,
    });
  };

  const startRound = () => {
    if (!wsClient || !lobby || state !== GameState.ROUND_SETUP) return;
    wsClient.send(WSEvent.GAME_STATE_CHANGE, {
      roomId: lobby.id,
      state: GameState.ROUND,
    });
  };

  return (
    <FriendFactsHostContext.Provider
      value={{
        gameId,
        gameType,
        state,
        setup,
        round,
        scores,
        counts,
        startRound,
        nextRound,
      }}
    >
      <div className="relative bg-gradient-to-br from-[var(--umati-sky)] to-[#3A6EE4] h-dvh w-dvw text-white">
        {children}
      </div>
    </FriendFactsHostContext.Provider>
  );
};

export const useFriendFactsHost = () => {
  const ctx = useContext(FriendFactsHostContext);
  if (!ctx) {
    throw new Error(
      "useFriendFactsHost must be used within FriendFactsHostProvider",
    );
  }
  return ctx;
};
