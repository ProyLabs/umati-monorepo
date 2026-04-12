"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useHostNextShortcut } from "@/hooks/use-host-next-shortcut";
import {
  DrawItRound,
  DrawItSegment,
  DrawItSetupState,
  GameState,
  Scores,
  WSEvent,
} from "@umati/ws";
import { useLobbyHost } from "@/providers/lobby-host-provider";

interface DrawItHostContextType {
  state: GameState;
  setup?: DrawItSetupState;
  round?: DrawItRound | null;
  scores: Scores;
  nextRound: () => void;
}

const DrawItHostContext = createContext<DrawItHostContextType | null>(null);

export const DrawItHostProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { wsClient, lobby, cancelGame } = useLobbyHost();
  const [state, setState] = useState<GameState>("BEFORE");
  const [setup, setSetup] = useState<DrawItSetupState | undefined>();
  const [round, setRound] = useState<DrawItRound | null>(null);
  const [scores, setScores] = useState<Scores>([]);

  useEffect(() => {
    if (!wsClient) return;

    const handleGameState = (payload: any) => {
      setState(payload.state);
      setSetup(undefined);
      setRound((payload.round as DrawItRound) ?? null);
      setScores(payload.scores ?? []);
    };

    const handleSetupUpdate = ({ state, setup }: any) => {
      setState(state);
      setSetup(setup);
      setRound(null);
    };

    const handleRoundStart = ({ state, round }: any) => {
      setState(state);
      setSetup(undefined);
      setRound(round);
    };

    const handleRoundUpdate = ({ state, round, scores }: any) => {
      setState(state);
      setRound(round);
      setScores(scores ?? []);
    };

    const handleRoundEnd = ({ state, round, scores }: any) => {
      setState(state);
      setRound(round);
      setScores(scores ?? []);
    };

    const handleSegment = ({ segment }: { segment: DrawItSegment }) => {
      setRound((current) =>
        current ? { ...current, segments: [...current.segments, segment] } : current,
      );
    };

    const handleCanvasClear = () => {
      setRound((current) => (current ? { ...current, segments: [] } : current));
    };

    wsClient.on(WSEvent.GAME_STATE, handleGameState);
    wsClient.on(WSEvent.DI_SETUP_UPDATE, handleSetupUpdate);
    wsClient.on(WSEvent.DI_ROUND_START, handleRoundStart);
    wsClient.on(WSEvent.DI_ROUND_UPDATE, handleRoundUpdate);
    wsClient.on(WSEvent.DI_ROUND_END, handleRoundEnd);
    wsClient.on(WSEvent.DI_DRAW_SEGMENT, handleSegment);
    wsClient.on(WSEvent.DI_CANVAS_CLEAR, handleCanvasClear);

    return () => {
      wsClient.off(WSEvent.GAME_STATE, handleGameState);
      wsClient.off(WSEvent.DI_SETUP_UPDATE, handleSetupUpdate);
      wsClient.off(WSEvent.DI_ROUND_START, handleRoundStart);
      wsClient.off(WSEvent.DI_ROUND_UPDATE, handleRoundUpdate);
      wsClient.off(WSEvent.DI_ROUND_END, handleRoundEnd);
      wsClient.off(WSEvent.DI_DRAW_SEGMENT, handleSegment);
      wsClient.off(WSEvent.DI_CANVAS_CLEAR, handleCanvasClear);
    };
  }, [wsClient]);

  const nextRound = () => {
    if (state === GameState.RANKING) {
      cancelGame();
      return;
    }

    if (!wsClient || !lobby || !round) return;
    const nextState =
      state === GameState.ROUND_END
        ? GameState.LEADERBOARD
        : state === GameState.LEADERBOARD
          ? round.turnNumber >= round.totalTurns
            ? GameState.RANKING
            : GameState.ROUND_SETUP
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
    <DrawItHostContext.Provider value={{ state, setup, round, scores, nextRound }}>
      <div className="relative min-h-dvh w-full overflow-x-hidden bg-gradient-to-br from-[var(--umati-sky)] to-[#3A6EE4] text-white">
        {children}
      </div>
    </DrawItHostContext.Provider>
  );
};

export const useDrawItHost = () => {
  const ctx = useContext(DrawItHostContext);
  if (!ctx) throw new Error("useDrawItHost must be used within DrawItHostProvider");
  return ctx;
};
