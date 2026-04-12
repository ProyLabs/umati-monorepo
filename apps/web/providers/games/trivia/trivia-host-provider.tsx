"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useHostNextShortcut } from "@/hooks/use-host-next-shortcut";
import { useLobbyHost } from "@/providers/lobby-host-provider"; // Host context provides wsClient
import {
  GameState,
  GameType,
  type QuizzerQuestionInput,
  type QuizzerSetupState,
  Scores,
  TriviaOptions,
  TriviaRound,
  WSEvent,
} from "@umati/ws";


interface TriviaHostContextType {
  gameId: string | null;
  gameType: string | null;
  state: GameState; // BEFORE, ROUND, ROUND_END, etc.
  round?: TriviaRound;
  setup?: QuizzerSetupState;
  scores: Scores;
  counts?: Record<TriviaOptions, number>;
  startGame: () => void;
  nextRound: () => void;
  syncQuizzerSetup: (questions: QuizzerQuestionInput[]) => void;
}

const TriviaHostContext = createContext<TriviaHostContextType | null>(null);

export const TriviaHostProvider = ({ children }: { children: React.ReactNode }) => {
  const { wsClient, lobby, cancelGame } = useLobbyHost();

  const [gameId, setGameId] = useState<string | null>(lobby?.game?.id ?? null);
  const [gameType, setGameType] = useState<string | null>(lobby?.game?.type ?? null);
  const [state, setState] = useState<GameState>("BEFORE");
  const [round, setRound] = useState<TriviaRound | undefined>(undefined);
  const [setup, setSetup] = useState<QuizzerSetupState | undefined>(undefined);
  const [counts, setCounts] = useState<Record<TriviaOptions, number> | undefined>(undefined);
  const [scores, setScores] = useState<Scores>([]);

  // --- WS Event Handlers ---
  useEffect(() => {
    if (!wsClient) return;

    const handleGameState = (payload: any) => {
      console.log("🚀 ~ TriviaHostProvider ~ payload:", payload);
      setGameId(payload.id);
      setGameType(payload.type);
      setState(payload.state);
      if (payload.round) setRound(payload.round as TriviaRound);
      setSetup(payload.setup as QuizzerSetupState | undefined);
      if (payload.counts) setCounts(payload.counts);
      if (payload.scores) setScores(payload.scores ?? []);
    };

    const handleRoundStart = ({ state, round }: any) => {
      setState(state);
      setRound(round);
    };

    const handleRoundEnd = ({ state, round, scores, counts }: any) => {
      setState(state);
      setRound(round);
      setScores(scores ?? []);
      setCounts(counts);
    };

    wsClient.on(WSEvent.GAME_STATE, handleGameState);
    wsClient.on(WSEvent.TRIVIA_ROUND_START, handleRoundStart);
    wsClient.on(WSEvent.TRIVIA_ROUND_END, handleRoundEnd);

    return () => {
      wsClient.off(WSEvent.GAME_STATE, handleGameState);
      wsClient.off(WSEvent.TRIVIA_ROUND_START, handleRoundStart);
      wsClient.off(WSEvent.TRIVIA_ROUND_END, handleRoundEnd);
    };

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
    if (state === GameState.RANKING) {
      cancelGame();
      return;
    }

    if (!wsClient || !lobby) return;
    const nextState =
      state === GameState.ROUND_END
        ? GameState.LEADERBOARD
        : state === GameState.LEADERBOARD
          ? round && round.number >= round.totalRounds
            ? GameState.RANKING
            : GameState.ROUND
          : null;

    if (!nextState) return;
    wsClient.send(WSEvent.GAME_STATE_CHANGE, {
      roomId: lobby.id,
      state: nextState,
    });
  };

  const syncQuizzerSetup = (questions: QuizzerQuestionInput[]) => {
    if (!wsClient || !lobby || gameType !== GameType.QUIZZER) return;
    wsClient.send(WSEvent.QZ_SETUP_SYNC, {
      roomId: lobby.id,
      questions,
    });
  };

  useHostNextShortcut(
    nextRound,
    state === GameState.ROUND_END ||
      state === GameState.LEADERBOARD ||
      state === GameState.RANKING,
  );

  return (
    <TriviaHostContext.Provider
      value={{
        gameId,
        gameType,
        state,
        round,
        setup,
        scores,
        counts,
        startGame,
        nextRound,
        syncQuizzerSetup,
      }}
    >
      <div
        className={
          gameType === GameType.QUIZZER
            ? "relative min-h-dvh w-full overflow-x-hidden bg-gradient-to-br from-orange-400 to-orange-600"
            : "relative min-h-dvh w-full overflow-x-hidden bg-gradient-to-br from-[#FE566B] to-[var(--umati-red)]"
        }
      >
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
