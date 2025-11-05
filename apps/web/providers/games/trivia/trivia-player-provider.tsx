"use client";
import { PlayerLeaveButton, Reactions } from "@/components/lobby/widgets";
import UmatiLogo from "@/components/ui/logo";
import { useLobbyPlayer } from "@/providers/lobby-player-provider"; // Player context provides wsClient
import { GameState, Scores, TriviaOptions, TriviaRound, WSEvent } from "@umati/ws";
import React, { createContext, useContext, useEffect, useState } from "react";

interface TriviaPlayerContextType {
  gameId: string | null;
  gameType: string | null;
  state: GameState; // BEFORE, ROUND, ROUND_END, etc.
  round?: TriviaRound;
  scores: Scores;
  submitAnswer: (option: TriviaOptions) => void;
}

const TriviaPlayerContext = createContext<TriviaPlayerContextType | null>(null);

export const TriviaPlayerProvider = ({ children }: { children: React.ReactNode }) => {
  const { wsClient, lobby, player } = useLobbyPlayer();

  const [gameId, setGameId] = useState<string | null>(lobby?.game?.id ?? null);
  const [gameType, setGameType] = useState<string | null>(lobby?.game?.type ?? null);
  const [state, setState] = useState<GameState>("BEFORE");
  const [round, setRound] = useState<TriviaRound | undefined>(undefined);
  const [scores, setScores] = useState<Scores>([]);

  // --- WS Event Handlers ---
  useEffect(() => {
    if (!wsClient) return;

    wsClient.on(WSEvent.GAME_STATE, (payload) => {
      setGameId(payload.id);
      setGameType(payload.type);
      setState(payload.state);
        if (payload.round) setRound(payload.round as TriviaRound);
        if (payload.scores) setScores(payload.scores);
    });

    wsClient.on(WSEvent.TRIVIA_ROUND_START, ({ round }) => {
      setState("ROUND");
      setRound(round);
    });

   wsClient.on(WSEvent.TRIVIA_ROUND_END, ({ state, round, scores }) => {
      setState(state);
      setRound(round);
      setScores(scores ?? []);
    });

    // wsClient.on("GAME_ENDED", ({ finalScores }) => {
    //   setState("GAME_END");
    //   setFinalScores(finalScores);
    // });
  }, [wsClient]);

  // --- Player Controls ---
  const submitAnswer = (option: TriviaOptions) => {
    if (!wsClient || !lobby) return;
    wsClient.send(WSEvent.TRIVIA_ROUND_ANSWER, { roomId: lobby.id, playerId: player?.id!, answer: option });
  };


  return (
    <TriviaPlayerContext.Provider
      value={{
        gameId,
        gameType,
        state,
        round,
        scores,
        submitAnswer,
      }}
    >
      <div className='bg-gradient-to-br from-[#FE566B] to-[var(--umati-red)] h-dvh w-dvw flex flex-col'>
      {children}

       <div className="flex items-center justify-center gap-4 w-full relative max-w-md mt-auto mx-auto px-4 pb-4">
        <UmatiLogo className="w-8 text-foreground block md:hidden" />
       <PlayerLeaveButton/>
        <Reactions />
      </div>
      </div>
    </TriviaPlayerContext.Provider>
  );
};

export const useTriviaPlayer = () => {
  const ctx = useContext(TriviaPlayerContext);
  if (!ctx) throw new Error("useTriviaPlayer must be used within TriviaPlayerProvider");
  return ctx;
};
