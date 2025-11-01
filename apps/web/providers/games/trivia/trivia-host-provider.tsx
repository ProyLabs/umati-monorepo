"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useLobbyHost } from "@/providers/lobby-host-provider"; // Host context provides wsClient
import { GameState, WSEvent } from "@umati/ws";

export interface TriviaRound {
  number: number;
  totalRounds: number;
  question: string;
  choices: string[];
  duration: number; // seconds
  startedAt: number; // timestamp (ms)
}

interface TriviaHostContextType {
  gameId: string | null;
  gameType: string | null;
  state: GameState; // BEFORE, ROUND, ROUND_END, etc.
  round?: TriviaRound;
  scores?: any[];
  finalScores?: any[];
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
  const [scores, setScores] = useState<any[]>([]);
  const [finalScores, setFinalScores] = useState<any[]>([]);

  // --- WS Event Handlers ---
  useEffect(() => {
    if (!wsClient) return;

    wsClient.on(WSEvent.GAME_STATE, (payload) => {
      setGameId(payload.id);
      setGameType(payload.type);
      setState(payload.state);
        if (payload.round) setRound(payload.round as TriviaRound);
        if (payload.scores) setScores(payload.scores);
      if (payload.finalScores) setFinalScores(payload.finalScores);
    });

    // wsClient.on("GAME_ROUND_STARTED", ({ round }) => {
    //   setState("ROUND");
    //   setRound(round);
    // });

    // wsClient.on("GAME_ROUND_ENDED", ({ scores }) => {
    //   setState("ROUND_END");
    //   setScores(scores);
    // });

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
        finalScores,
        startGame,
        nextRound,
      }}
    >
      <div className='bg-gradient-to-br from-[#FE566B] to-[var(--umati-red)] h-screen w-screen'>
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
