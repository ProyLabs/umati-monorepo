"use client";
import { PlayerLeaveButton, Reactions } from "@/components/lobby/widgets";
import UmatiLogo from "@/components/ui/logo";
import { useLobbyPlayer } from "@/providers/lobby-player-provider"; // Player context provides wsClient
import { GameState, Scores, HerdMentalityOptions, HerdMentalityRound, WSEvent } from "@umati/ws";
import React, { createContext, useContext, useEffect, useState } from "react";

interface HerdMentalityPlayerContextType {
  gameId: string | null;
  gameType: string | null;
  state: GameState; // BEFORE, ROUND, ROUND_END, etc.
  round?: HerdMentalityRound;
  scores: Scores;
  myAnswer: HerdMentalityOptions|null;
  submitAnswer: (option: HerdMentalityOptions) => void;
}

const HerdMentalityPlayerContext = createContext<HerdMentalityPlayerContextType | null>(null);

export const HerdMentalityPlayerProvider = ({ children }: { children: React.ReactNode }) => {
  const { wsClient, lobby, player } = useLobbyPlayer();

  const [gameId, setGameId] = useState<string | null>(lobby?.game?.id ?? null);
  const [gameType, setGameType] = useState<string | null>(lobby?.game?.type ?? null);
  const [state, setState] = useState<GameState>("BEFORE");
  const [round, setRound] = useState<HerdMentalityRound | undefined>(undefined);
  const [scores, setScores] = useState<Scores>([]);
  const [myAnswer, setMyAnswer] = useState<HerdMentalityOptions|null>(null);

  // --- WS Event Handlers ---
  useEffect(() => {
    if (!wsClient) return;

    wsClient.on(WSEvent.GAME_STATE, (payload) => {
      setGameId(payload.id);
      setGameType(payload.type);
      setState(payload.state);
        if (payload.round) setRound(payload.round as HerdMentalityRound);
        if (payload.scores) setScores(payload.scores);
    });

    wsClient.on(WSEvent.GAME_MY_ANSWER, ({answer}) => {
      console.log("🚀 ~ HerdMentalityPlayerProvider ~ answer:", answer)
      setMyAnswer(answer);
    });

    wsClient.on(WSEvent.HM_ROUND_START, ({ round }) => {
      setState("ROUND");
      setRound(round);
      setMyAnswer(null)
    });

   wsClient.on(WSEvent.HM_ROUND_END, ({ state, round, scores }) => {
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
  const submitAnswer = (option: HerdMentalityOptions) => {
    setMyAnswer(option);
    if (!wsClient || !lobby) return;
    wsClient.send(WSEvent.HM_ROUND_ANSWER, { roomId: lobby.id, playerId: player?.id!, answer: option });
  };


  return (
    <HerdMentalityPlayerContext.Provider
      value={{
        gameId,
        gameType,
        state,
        round,
        scores,
        myAnswer,
        submitAnswer,
      }}
    >
      <div className='bg-gradient-to-br from-(--umati-aqua) to-[#00D9D5] text-white  h-dvh w-dvw flex flex-col'>
      {children}

       <div className="flex items-center justify-center gap-4 w-full relative max-w-md mt-auto mx-auto px-4 pb-4">
        <UmatiLogo className="w-8 text-foreground block md:hidden" />
       <PlayerLeaveButton/>
        <Reactions />
      </div>
      </div>
    </HerdMentalityPlayerContext.Provider>
  );
};

export const useHerdMentalityPlayer = () => {
  const ctx = useContext(HerdMentalityPlayerContext);
  if (!ctx) throw new Error("useHerdMentalityPlayer must be used within HerdMentalityPlayerProvider");
  return ctx;
};
