"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  CodenamesRound,
  CodenamesSetupState,
  CodenamesTeam,
  GameState,
  Scores,
  WSEvent,
} from "@umati/ws";
import { useLobbyPlayer } from "@/providers/lobby-player-provider";
import { PlayerLeaveButton, Reactions } from "@/components/lobby/widgets";
import UmatiLogo from "@/components/ui/logo";

interface CodenamesPlayerContextType {
  state: GameState;
  setup?: CodenamesSetupState;
  round?: CodenamesRound | null;
  scores: Scores;
  toggleSpymaster: () => void;
  pickCard: (cardId: string) => void;
  passTurn: (team: CodenamesTeam) => void;
}

const CodenamesPlayerContext = createContext<CodenamesPlayerContextType | null>(
  null,
);

export const CodenamesPlayerProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { wsClient, lobby, player } = useLobbyPlayer();
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

  const toggleSpymaster = () => {
    if (!wsClient || !lobby || !player) return;
    wsClient.send(WSEvent.CN_SET_SPYMASTER, {
      roomId: lobby.id,
      playerId: player.id,
    });
  };

  const pickCard = (cardId: string) => {
    if (!wsClient || !lobby || !player) return;
    wsClient.send(WSEvent.CN_CARD_PICK, {
      roomId: lobby.id,
      playerId: player.id,
      cardId,
    });
  };

  const passTurn = (team: CodenamesTeam) => {
    if (!wsClient || !lobby || !player) return;
    wsClient.send(WSEvent.CN_PASS_TURN, {
      roomId: lobby.id,
      playerId: player.id,
      team,
    });
  };

  return (
    <CodenamesPlayerContext.Provider
      value={{
        state,
        setup,
        round,
        scores,
        toggleSpymaster,
        pickCard,
        passTurn,
      }}
    >
      <div className="flex h-dvh w-dvw flex-col bg-gradient-to-br from-yellow-300 to-yellow-400 text-black">
        {children}
        <div className="relative mx-auto mt-auto flex w-full max-w-md items-center justify-center gap-4 px-4 pb-4">
          <UmatiLogo className="block w-8 text-foreground md:hidden" />
          <PlayerLeaveButton />
          <Reactions />
        </div>
      </div>
    </CodenamesPlayerContext.Provider>
  );
};

export const useCodenamesPlayer = () => {
  const ctx = useContext(CodenamesPlayerContext);
  if (!ctx) {
    throw new Error(
      "useCodenamesPlayer must be used within CodenamesPlayerProvider",
    );
  }
  return ctx;
};
