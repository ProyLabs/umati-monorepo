"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useLobbyHost } from "@/providers/lobby-host-provider"; // Host context provides wsClient
import { ChameleonRound, GameState, Scores, WSEvent } from "@umati/ws";

interface ChameleonHostContextType {
  gameId: string | null;
  gameType: string | null;
  state: GameState; // BEFORE, ROUND, ROUND_END, etc.
  round?: ChameleonRound;
    scores: Scores;
    counts?: Record<string, number>;
  startGame: () => void;
  nextRound: () => void;
  startSpeakingRound: () => void;
  startVotingRound: () => void;
}

const ChameleonHostContext = createContext<ChameleonHostContextType | null>(null);

export const ChameleonHostProvider = ({ children }: { children: React.ReactNode }) => {
  const { wsClient, lobby } = useLobbyHost();

  const [gameId, setGameId] = useState<string | null>(lobby?.game?.id ?? null);
  const [gameType, setGameType] = useState<string | null>(lobby?.game?.type ?? null);
  const [state, setState] = useState<GameState>("BEFORE");
  const [round, setRound] = useState<ChameleonRound | undefined>(undefined);
  const [counts, setCounts] = useState<Record<string, number> | undefined>(undefined);
  const [scores, setScores] = useState<Scores>([]);

  // --- WS Event Handlers ---
  useEffect(() => {
    if (!wsClient) return;

    wsClient.on(WSEvent.GAME_STATE, (payload) => {
      console.log("🚀 ~ ChameleonHostProvider ~ payload:", payload);
      setGameId(payload.id);
      setGameType(payload.type);
      setState(payload.state);
        if (payload.round) setRound(payload.round as ChameleonRound);
        setCounts(payload.round.counts);
        if (payload.scores) setScores(payload.scores ?? []);
    });

    wsClient.on(WSEvent.CH_ROUND_START, ({ state, round }) => {
      setState(state);
      setRound(round);
    });

    wsClient.on(WSEvent.CH_ROUND_END, ({ state, round, scores }) => {
      setState(state);
      setRound(round);
      setScores(scores ?? []);
      // setCounts(counts);
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

  const startSpeakingRound = () => {
     if (!wsClient || !lobby) return;
     wsClient.send(WSEvent.CH_ROUND_STATE_CHANGE, { roomId: lobby.id, state: GameState.SPEAKING });
  }

    const startVotingRound = () => {
     if (!wsClient || !lobby) return;
     wsClient.send(WSEvent.CH_ROUND_STATE_CHANGE, { roomId: lobby.id, state: GameState.VOTING });
  }

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
        round,
        scores,
        counts,
        startGame,
        nextRound,
        startSpeakingRound,
        startVotingRound
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
