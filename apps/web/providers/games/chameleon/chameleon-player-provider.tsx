"use client";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useLobbyPlayer } from "@/providers/lobby-player-provider"; // Player context provides wsClient
import {
  ChameleonRound,
  ChameleonRoundRole,
  GameState,
  Scores,
  WSEvent,
} from "@umati/ws";
import { PlayerLeaveButton, Reactions } from "@/components/lobby/widgets";
import UmatiLogo from "@/components/ui/logo";

interface ChameleonPlayerContextType {
  gameId: string | null;
  gameType: string | null;
  state: GameState; // BEFORE, ROUND, ROUND_END, etc.
  round?: ChameleonRound;
  role?: ChameleonRoundRole;
  myVote: string | null;
  startGame: () => void;
  nextRound: () => void;
  submitVote: (id: string) => void;
}

const ChameleonPlayerContext = createContext<ChameleonPlayerContextType | null>(
  null
);

export const ChameleonPlayerProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { wsClient, lobby, player } = useLobbyPlayer();

  const [gameId, setGameId] = useState<string | null>(lobby?.game?.id ?? null);
  const [gameType, setGameType] = useState<string | null>(
    lobby?.game?.type ?? null
  );
  const [state, setState] = useState<GameState>("BEFORE");
  const [round, setRound] = useState<ChameleonRound | undefined>(undefined);
  const [role, setRole] = useState<ChameleonRoundRole | undefined>(undefined);
  const [votes, setVotes] = useState<Record<string,string>| undefined>(undefined);
  // const [counts, setCounts] = useState<Record<ChameleonOptions, number> | undefined>(undefined);
  const [scores, setScores] = useState<Scores>([]);

  // --- WS Event Handlers ---
  useEffect(() => {
    if (!wsClient) return;

    wsClient.on(WSEvent.GAME_STATE, (payload) => {
      console.log("🚀 ~ ChameleonPlayerProvider ~ payload:", payload);
      setGameId(payload.id);
      setGameType(payload.type);
      setState(payload.state);
      if (payload.round) {
        setRound(payload.round as ChameleonRound);
        const role = payload.round.roles[player?.id!];
        setRole(role);
        setVotes(payload.round.votes);
      }
      // if (payload.counts) setCounts(payload.counts);
      if (payload.scores) setScores(payload.scores ?? []);
    });

    wsClient.on(WSEvent.CH_ROUND_START, ({ state, round }) => {
      setState(state);
      setRound(round);
      const role = round.roles[player?.id!];
      console.log("🚀 ~ ChameleonPlayerProvider ~ role:", role);
      setRole(role);
    });

    wsClient.on(WSEvent.CH_ROUND_END, ({ state, round, scores }) => {
      setState(state);
      setRound(round);
      const role = round.roles[player?.id!];
      setRole(role);
      setScores(scores ?? []);
      // setCounts(counts);
    });

    // wsClient.on("GAME_ENDED", ({ finalScores }) => {
    //   setState("GAME_END");
    //   setFinalScores(finalScores);
    // });
  }, [wsClient]);

  // --- Player Controls ---
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

  const submitVote = (id: string) => {
      if (!wsClient || !lobby) return;
        wsClient.send(WSEvent.CH_ROUND_VOTE, { roomId: lobby.id, playerId: player?.id!, answer: id });
  }


  const myVote = useMemo(() => {
    console.log("🚀 ~ ChameleonPlayerProvider ~ votes:", votes)
    if (!votes || !player) return null;
    const x = votes[player.id];
    console.log("🚀 ~ ChameleonPlayerProvider ~ myVote ~ x:", x)
    return votes[player.id] ?? null;
  }, [votes, player])

  return (
    <ChameleonPlayerContext.Provider
      value={{
        gameId,
        gameType,
        state,
        round,
        role,
        myVote,
        // scores,
        // counts,
        startGame,
        nextRound,
        submitVote
      }}
    >
      <div className="bg-gradient-to-br from-lime-500 to-green-600 text-white h-dvh w-dvw flex flex-col">
        {children}

        <div className="flex items-center justify-center gap-4 w-full relative max-w-md mt-auto mx-auto px-4 pb-4">
          <UmatiLogo className="w-8 text-foreground block md:hidden" />
          <PlayerLeaveButton />
          <Reactions />
        </div>
      </div>
    </ChameleonPlayerContext.Provider>
  );
};

export const useChameleonPlayer = () => {
  const ctx = useContext(ChameleonPlayerContext);
  if (!ctx)
    throw new Error(
      "useChameleonPlayer must be used within ChameleonPlayerProvider"
    );
  return ctx;
};
