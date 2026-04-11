"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  DrawItRound,
  DrawItSegment,
  DrawItSetupState,
  GameState,
  Scores,
  WSEvent,
} from "@umati/ws";
import { useLobbyPlayer } from "@/providers/lobby-player-provider";
import { PlayerLeaveButton, Reactions } from "@/components/lobby/widgets";
import UmatiLogo from "@/components/ui/logo";

interface DrawItPlayerContextType {
  state: GameState;
  setup?: DrawItSetupState;
  round?: DrawItRound | null;
  scores: Scores;
  pickWord: (word: string) => void;
  submitSegment: (segment: DrawItSegment) => void;
  clearCanvas: () => void;
  submitGuess: (guess: string) => void;
}

const DrawItPlayerContext = createContext<DrawItPlayerContextType | null>(null);

export const DrawItPlayerProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { wsClient, lobby, player } = useLobbyPlayer();
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

  const pickWord = (word: string) => {
    if (!wsClient || !lobby || !player) return;
    wsClient.send(WSEvent.DI_WORD_PICK, {
      roomId: lobby.id,
      playerId: player.id,
      word,
    });
  };

  const submitSegment = (segment: DrawItSegment) => {
    if (!wsClient || !lobby || !player) return;
    wsClient.send(WSEvent.DI_DRAW_SEGMENT, {
      roomId: lobby.id,
      playerId: player.id,
      segment,
    });
  };

  const clearCanvas = () => {
    if (!wsClient || !lobby || !player) return;
    wsClient.send(WSEvent.DI_CANVAS_CLEAR, {
      roomId: lobby.id,
      playerId: player.id,
    });
  };

  const submitGuess = (guess: string) => {
    if (!wsClient || !lobby || !player) return;
    wsClient.send(WSEvent.DI_GUESS, {
      roomId: lobby.id,
      playerId: player.id,
      guess,
    });
  };

  return (
    <DrawItPlayerContext.Provider
      value={{ state, setup, round, scores, pickWord, submitSegment, clearCanvas, submitGuess }}
    >
      <div className="flex h-dvh w-dvw flex-col bg-gradient-to-br from-[var(--umati-sky)] to-[#3A6EE4] text-white">
        {children}
        <div className="relative mx-auto mt-auto flex w-full max-w-md items-center justify-center gap-4 px-4 pb-4">
          <UmatiLogo className="block w-8 text-foreground md:hidden" />
          <PlayerLeaveButton />
          <Reactions />
        </div>
      </div>
    </DrawItPlayerContext.Provider>
  );
};

export const useDrawItPlayer = () => {
  const ctx = useContext(DrawItPlayerContext);
  if (!ctx) throw new Error("useDrawItPlayer must be used within DrawItPlayerProvider");
  return ctx;
};
