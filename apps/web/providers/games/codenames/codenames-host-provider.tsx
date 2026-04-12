"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  CodenamesRound,
  CodenamesSetupState,
  GameState,
  Scores,
  WSEvent,
} from "@umati/ws";
import { useLobbyHost } from "@/providers/lobby-host-provider";
import { EndGameButton } from "@/components/games/shared";
import { useHostNextShortcut } from "@/hooks/use-host-next-shortcut";

interface CodenamesHostContextType {
  state: GameState;
  setup?: CodenamesSetupState;
  round?: CodenamesRound | null;
  scores: Scores;
  startMatch: () => void;
  nextRound: () => void;
}

const CodenamesHostContext = createContext<CodenamesHostContextType | null>(
  null,
);

export const CodenamesHostProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { wsClient, lobby, cancelGame } = useLobbyHost();
  const [state, setState] = useState<GameState>("BEFORE");
  const [setup, setSetup] = useState<CodenamesSetupState | undefined>();
  const [round, setRound] = useState<CodenamesRound | null>(null);
  const [scores, setScores] = useState<Scores>([]);

  useEffect(() => {
    if (!wsClient) return;

    const handleGameState = (payload: any) => {
      setState(payload.state);
      setSetup(undefined);
      setRound((payload.round as CodenamesRound) ?? null);
      setScores(payload.scores ?? []);
    };

    const handleSetupUpdate = ({ state, setup }: any) => {
      setState(state);
      setSetup(setup);
      setRound(null);
    };

    const handleStateUpdate = ({ state, round, scores }: any) => {
      setState(state);
      setSetup(undefined);
      setRound(round);
      setScores(scores ?? []);
    };

    wsClient.on(WSEvent.GAME_STATE, handleGameState);
    wsClient.on(WSEvent.CN_SETUP_UPDATE, handleSetupUpdate);
    wsClient.on(WSEvent.CN_STATE_UPDATE, handleStateUpdate);

    return () => {
      wsClient.off(WSEvent.GAME_STATE, handleGameState);
      wsClient.off(WSEvent.CN_SETUP_UPDATE, handleSetupUpdate);
      wsClient.off(WSEvent.CN_STATE_UPDATE, handleStateUpdate);
    };
  }, [wsClient]);

  const startMatch = () => {
    if (!wsClient || !lobby || !setup?.canStart) return;
    wsClient.send(WSEvent.GAME_STATE_CHANGE, {
      roomId: lobby.id,
      state: GameState.ROUND,
    });
  };

  const nextRound = () => {
    cancelGame();
  };

  useHostNextShortcut(nextRound, state === GameState.RANKING);

  return (
    <CodenamesHostContext.Provider
      value={{ state, setup, round, scores, startMatch, nextRound }}
    >
      <div className="relative min-h-dvh w-full overflow-x-hidden bg-gradient-to-br from-yellow-300 to-yellow-400 text-black">
        <div className="absolute right-4 top-4 z-50">
          <EndGameButton />
        </div>
        {children}
      </div>
    </CodenamesHostContext.Provider>
  );
};

export const useCodenamesHost = () => {
  const ctx = useContext(CodenamesHostContext);
  if (!ctx) {
    throw new Error(
      "useCodenamesHost must be used within CodenamesHostProvider",
    );
  }
  return ctx;
};
