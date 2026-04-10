"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  FriendFactsFactInput,
  FriendFactsRound,
  FriendFactsSetupState,
  GameState,
  Scores,
  WSEvent,
} from "@umati/ws";
import { useLobbyPlayer } from "@/providers/lobby-player-provider";
import { PlayerLeaveButton, Reactions } from "@/components/lobby/widgets";
import UmatiLogo from "@/components/ui/logo";

interface FriendFactsPlayerContextType {
  gameId: string | null;
  gameType: string | null;
  state: GameState;
  setup?: FriendFactsSetupState;
  round?: FriendFactsRound | null;
  scores: Scores;
  myAnswer: string | null;
  submitFacts: (facts: FriendFactsFactInput[]) => void;
  submitAnswer: (answerPlayerId: string) => void;
}

const FriendFactsPlayerContext =
  createContext<FriendFactsPlayerContextType | null>(null);

export const FriendFactsPlayerProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { wsClient, lobby, player } = useLobbyPlayer();
  const [gameId, setGameId] = useState<string | null>(lobby?.game?.id ?? null);
  const [gameType, setGameType] = useState<string | null>(
    lobby?.game?.type ?? null,
  );
  const [state, setState] = useState<GameState>("BEFORE");
  const [setup, setSetup] = useState<FriendFactsSetupState | undefined>();
  const [round, setRound] = useState<FriendFactsRound | null>(null);
  const [scores, setScores] = useState<Scores>([]);
  const [myAnswer, setMyAnswer] = useState<string | null>(null);

  useEffect(() => {
    if (!wsClient) return;

    wsClient.on(WSEvent.GAME_STATE, (payload) => {
      setGameId(payload.id);
      setGameType(payload.type);
      setState(payload.state);
      setRound((payload.round as FriendFactsRound) ?? null);
      setScores(payload.scores ?? []);
    });

    wsClient.on(WSEvent.FF_SETUP_UPDATE, ({ state, setup }) => {
      setState(state);
      setSetup(setup);
      setRound(null);
      setMyAnswer(null);
    });

    wsClient.on(WSEvent.FF_ROUND_START, ({ state, round }) => {
      setState(state);
      setRound(round);
      setMyAnswer(null);
    });

    wsClient.on(WSEvent.FF_ROUND_ANSWERED, ({ answerPlayerId }) => {
      setMyAnswer(answerPlayerId);
    });

    wsClient.on(WSEvent.FF_ROUND_END, ({ state, round, scores }) => {
      setState(state);
      setRound(round);
      setScores(scores ?? []);
    });
  }, [wsClient]);

  const submitFacts = (facts: FriendFactsFactInput[]) => {
    if (!wsClient || !lobby || !player) return;
    wsClient.send(WSEvent.FF_SETUP_SUBMIT, {
      roomId: lobby.id,
      playerId: player.id,
      facts,
    });
  };

  const submitAnswer = (answerPlayerId: string) => {
    if (!wsClient || !lobby || !player || myAnswer) return;
    setMyAnswer(answerPlayerId);
    wsClient.send(WSEvent.FF_ROUND_ANSWER, {
      roomId: lobby.id,
      playerId: player.id,
      answerPlayerId,
    });
  };

  return (
    <FriendFactsPlayerContext.Provider
      value={{
        gameId,
        gameType,
        state,
        setup,
        round,
        scores,
        myAnswer,
        submitFacts,
        submitAnswer,
      }}
    >
      <div className="bg-gradient-to-br from-[var(--umati-sky)] to-[#3A6EE4] h-dvh w-dvw flex flex-col text-white">
        {children}
        <div className="flex items-center justify-center gap-4 w-full relative max-w-md mt-auto mx-auto px-4 pb-4">
          <UmatiLogo className="w-8 text-foreground block md:hidden" />
          <PlayerLeaveButton />
          <Reactions />
        </div>
      </div>
    </FriendFactsPlayerContext.Provider>
  );
};

export const useFriendFactsPlayer = () => {
  const ctx = useContext(FriendFactsPlayerContext);
  if (!ctx) {
    throw new Error(
      "useFriendFactsPlayer must be used within FriendFactsPlayerProvider",
    );
  }
  return ctx;
};
