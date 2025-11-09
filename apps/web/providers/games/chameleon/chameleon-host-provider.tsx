"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useLobbyHost } from "@/providers/lobby-host-provider"; // Host context provides wsClient
import { GameState, Scores, WSEvent } from "@umati/ws";

interface ChameleonHostContextType {
  gameId: string | null;
  gameType: string | null;
  state: GameState; // BEFORE, ROUND, ROUND_END, etc.
  startGame: () => void;
  nextRound: () => void;
}

const ChameleonHostContext = createContext<ChameleonHostContextType | null>(null);

export const ChameleonHostProvider = ({ children }: { children: React.ReactNode }) => {
  const { wsClient, lobby } = useLobbyHost();

  const [gameId, setGameId] = useState<string | null>(lobby?.game?.id ?? null);
  const [gameType, setGameType] = useState<string | null>(lobby?.game?.type ?? null);
  const [state, setState] = useState<GameState>("ROUND_SETUP");
  // const [round, setRound] = useState<ChameleonRound | undefined>(undefined);
  // const [counts, setCounts] = useState<Record<ChameleonOptions, number> | undefined>(undefined);
  // const [scores, setScores] = useState<Scores>([]);

  // --- WS Event Handlers ---
  // useEffect(() => {
  //   if (!wsClient) return;

  //   wsClient.on(WSEvent.GAME_STATE, (payload) => {
  //     console.log("🚀 ~ ChameleonHostProvider ~ payload:", payload);
  //     setGameId(payload.id);
  //     setGameType(payload.type);
  //     setState(payload.state);
  //       if (payload.round) setRound(payload.round as ChameleonRound);
  //       if (payload.counts) setCounts(payload.counts);
  //       if (payload.scores) setScores(payload.scores ?? []);
  //   });

  //   wsClient.on(WSEvent.HM_ROUND_START, ({ state, round }) => {
  //     setState(state);
  //     setRound(round);
  //   });

  //   wsClient.on(WSEvent.HM_ROUND_END, ({ state, round, scores, counts }) => {
  //     setState(state);
  //     setRound(round);
  //     setScores(scores ?? []);
  //     setCounts(counts);
  //   });

  //   // wsClient.on("GAME_ENDED", ({ finalScores }) => {
  //   //   setState("GAME_END");
  //   //   setFinalScores(finalScores);
  //   // });
  // }, [wsClient]);

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
    <ChameleonHostContext.Provider
      value={{
        gameId,
        gameType,
        state,
        // round,
        // scores,
        // counts,
        startGame,
        nextRound,
      }}
    >
      <div className='bg-gradient-to-br from-lime-500 to-green-600 text-white h-dvh w-dvw'>
      {children}
      </div>
    </ChameleonHostContext.Provider>
  );
};

export const useChameleonHost = () => {
  const ctx = useContext(ChameleonHostContext);
  if (!ctx) throw new Error("useChameleonHost must be used within ChameleonHostProvider");
  return ctx;
};
