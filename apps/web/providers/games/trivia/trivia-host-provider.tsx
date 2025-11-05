"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useLobbyHost } from "@/providers/lobby-host-provider"; // Host context provides wsClient
import { GameState, Scores, TriviaOptions, TriviaRound, WSEvent } from "@umati/ws";

interface TriviaHostContextType {
  gameId: string | null;
  gameType: string | null;
  state: GameState; // BEFORE, ROUND, ROUND_END, etc.
  round?: TriviaRound;
  scores: Scores;
  counts?: Record<TriviaOptions, number>;
  startGame: () => void;
  nextRound: () => void;
}

const TriviaHostContext = createContext<TriviaHostContextType | null>(null);

export const TriviaHostProvider = ({ children }: { children: React.ReactNode }) => {
  const { wsClient, lobby } = useLobbyHost();

  const [gameId, setGameId] = useState<string | null>(lobby?.game?.id ?? null);
  const [gameType, setGameType] = useState<string | null>(lobby?.game?.type ?? null);
  const [state, setState] = useState<GameState>("BEFORE");
  const [round, setRound] = useState<TriviaRound | undefined>(undefined);
  const [counts, setCounts] = useState<Record<TriviaOptions, number> | undefined>(undefined);
  const [scores, setScores] = useState<Scores>([]);

  // --- WS Event Handlers ---
  useEffect(() => {
    if (!wsClient) return;

    wsClient.on(WSEvent.GAME_STATE, (payload) => {
      console.log("🚀 ~ TriviaHostProvider ~ payload:", payload);
      setGameId(payload.id);
      setGameType(payload.type);
      setState(payload.state);
        if (payload.round) setRound(payload.round as TriviaRound);
        if (payload.counts) setCounts(payload.counts);
        if (payload.scores) setScores(payload.scores ?? []);
    });

    wsClient.on(WSEvent.TRIVIA_ROUND_START, ({ state, round }) => {
      setState(state);
      setRound(round);
    });

    wsClient.on(WSEvent.TRIVIA_ROUND_END, ({ state, round, scores, counts }) => {
      setState(state);
      setRound(round);
      setScores(scores ?? []);
      setCounts(counts);
    });

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
    // if (!wsClient || !lobby) return;
    // wsClient.send(
    //   JSON.stringify({
    //     event: "GAME_NEXT_ROUND",
    //     payload: { roomId: lobby.id },
    //   })
    // );
  };

  return (
    <TriviaHostContext.Provider
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
      <div className='bg-gradient-to-br from-[#FE566B] to-[var(--umati-red)] h-dvh w-dvw'>
      {children}
      </div>
    </TriviaHostContext.Provider>
  );
};

export const useTriviaHost = () => {
  const ctx = useContext(TriviaHostContext);
  if (!ctx) throw new Error("useTriviaHost must be used within TriviaHostProvider");
  return ctx;
};
