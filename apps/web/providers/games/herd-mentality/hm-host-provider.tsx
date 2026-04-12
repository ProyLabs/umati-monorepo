"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useHostNextShortcut } from "@/hooks/use-host-next-shortcut";
import { useLobbyHost } from "@/providers/lobby-host-provider"; // Host context provides wsClient
import { GameState, Scores, HerdMentalityOptions, HerdMentalityRound, WSEvent } from "@umati/ws";


interface HerdMentalityHostContextType {
  gameId: string | null;
  gameType: string | null;
  state: GameState; // BEFORE, ROUND, ROUND_END, etc.
  round?: HerdMentalityRound;
  scores: Scores;
  counts?: Record<HerdMentalityOptions, number>;
  startGame: () => void;
  nextRound: () => void;
}

const HerdMentalityHostContext = createContext<HerdMentalityHostContextType | null>(null);

export const HerdMentalityHostProvider = ({ children }: { children: React.ReactNode }) => {
  const { wsClient, lobby, cancelGame } = useLobbyHost();

  const [gameId, setGameId] = useState<string | null>(lobby?.game?.id ?? null);
  const [gameType, setGameType] = useState<string | null>(lobby?.game?.type ?? null);
  const [state, setState] = useState<GameState>("BEFORE");
  const [round, setRound] = useState<HerdMentalityRound | undefined>(undefined);
  const [counts, setCounts] = useState<Record<HerdMentalityOptions, number> | undefined>(undefined);
  const [scores, setScores] = useState<Scores>([]);

  // --- WS Event Handlers ---
  useEffect(() => {
    if (!wsClient) return;

    const handleGameState = (payload: any) => {
      console.log("🚀 ~ HerdMentalityHostProvider ~ payload:", payload);
      setGameId(payload.id);
      setGameType(payload.type);
      setState(payload.state);
      if (payload.round) setRound(payload.round as HerdMentalityRound);
      if (payload.counts) setCounts(payload.counts);
      if (payload.scores) setScores(payload.scores ?? []);
    };

    const handleRoundStart = ({ state, round }: any) => {
      setState(state);
      setRound(round);
    };

    const handleRoundEnd = ({ state, round, scores, counts }: any) => {
      setState(state);
      setRound(round);
      setScores(scores ?? []);
      setCounts(counts);
    };

    wsClient.on(WSEvent.GAME_STATE, handleGameState);
    wsClient.on(WSEvent.HM_ROUND_START, handleRoundStart);
    wsClient.on(WSEvent.HM_ROUND_END, handleRoundEnd);

    return () => {
      wsClient.off(WSEvent.GAME_STATE, handleGameState);
      wsClient.off(WSEvent.HM_ROUND_START, handleRoundStart);
      wsClient.off(WSEvent.HM_ROUND_END, handleRoundEnd);
    };

    // wsClient.on("GAME_ENDED", ({ finalScores }) => {
    //   setState("GAME_END");
    //   setFinalScores(finalScores);
    // });
  }, [wsClient]);

  // --- Host Controls ---
  const startGame = () => {
    if (!wsClient || !lobby) return;
    wsClient.send(WSEvent.GAME_START, { roomId: lobby.id });
  };

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

  useHostNextShortcut(
    nextRound,
    state === GameState.ROUND_END ||
      state === GameState.LEADERBOARD ||
      state === GameState.RANKING,
  );

  return (
    <HerdMentalityHostContext.Provider
      value={{
        gameId,
        gameType,
        state,
        round,
        scores,
        counts,
        startGame,
        nextRound,
      }}
    >
      <div className="relative min-h-dvh w-full overflow-x-hidden bg-gradient-to-br from-(--umati-aqua) to-[#00D9D5] text-white">
        {children}
      </div>
    </HerdMentalityHostContext.Provider>
  );
};

export const useHerdMentalityHost = () => {
  const ctx = useContext(HerdMentalityHostContext);
  if (!ctx) throw new Error("useHerdMentalityHost must be used within HerdMentalityHostProvider");
  return ctx;
};
