"use client";

import { PlayerAvatar } from "@/components/lobby/widgets";
import { Fbutton } from "@/components/ui/fancy-button";
import { Input } from "@/components/ui/input";
import { useLobbyHost } from "@/providers/lobby-host-provider";
import { useLobbyPlayer } from "@/providers/lobby-player-provider";
import { useFriendFactsHost } from "@/providers/games/friend-facts/friend-facts-host-provider";
import { useFriendFactsPlayer } from "@/providers/games/friend-facts/friend-facts-player-provider";
import { cn } from "@/lib/utils";
import { Trash2Icon } from "lucide-react";
import { Fragment, useEffect, useState } from "react";
import { motion } from "motion/react";
import { EndGameButton, ScoreGapHint } from "../shared";
import { Timer } from "../trivia/widgets";

export const FriendFactsTitleScreen = () => {
  return (
    <div className="flex h-full items-center justify-center px-4">
      <div className="text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/60">
          Friend Facts
        </p>
        <h2 className="mt-3 text-5xl font-black tracking-tight text-white md:text-6xl">
          Bring your best fact
        </h2>
      </div>
    </div>
  );
};

export const FriendFactsHostSetup = () => {
  const { players, lobby } = useLobbyHost();
  const { setup, startRound } = useFriendFactsHost();
  const totalFacts = Object.values(setup?.factsPerPlayer ?? {}).reduce(
    (sum, count) => sum + count,
    0,
  );
  const everyoneReady =
    players.length > 0 &&
    (setup?.readyPlayerIds.length ?? 0) === players.length;

  return (
    <>
      <div className="fixed top-0 px-8 py-4 w-full">
        <div className="flex items-center justify-between w-full">
          <div className="">
            <p className="text-xl font-medium">
              <span className="font-bold ">{lobby?.name}</span> Code:{" "}
              {lobby?.code}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {everyoneReady && (
              <Fbutton onClick={startRound}>Start Game</Fbutton>
            )}
            <EndGameButton />
          </div>
        </div>
      </div>
      <div className="flex h-full flex-col items-center justify-center gap-8 px-4 py-6">
        <div className="text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/60">
            Fact Collection
          </p>
          <h2 className="mt-3 text-5xl font-black tracking-tight text-white md:text-6xl">
            Waiting for player facts
          </h2>
        </div>

        <div className="grid w-full max-w-5xl gap-4 md:grid-cols-[1fr_320px]">
          <div className="rounded-xl border border-white/12 bg-black/15 p-5">
            <div className="grid gap-3">
              {players.map((player) => {
                const count = setup?.factsPerPlayer[player.id] ?? 0;
                const ready = count > 0;
                return (
                  <div
                    key={player.id}
                    className="flex items-center justify-between rounded-[1.5rem] border border-white/10 bg-white/8 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <PlayerAvatar
                        displayName={player.displayName}
                        avatar={player.avatar ?? ""}
                        className="size-14 mb-0"
                        showName={false}
                      />
                      <div>
                        <p className="font-bold text-white">
                          {player.displayName}
                        </p>
                        <p className="text-sm text-white/60">
                          {count} fact{count === 1 ? "" : "s"}
                        </p>
                      </div>
                    </div>
                    <div
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.18em]",
                        ready
                          ? "bg-emerald-400/20 text-emerald-100"
                          : "bg-white/10 text-white/60",
                      )}
                    >
                      {ready ? "Ready" : "Waiting"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border border-white/12 bg-black/15 p-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/55">
              Progress
            </p>
            <div className="mt-4 grid gap-3">
              <div className="rounded-[1.5rem] border border-white/10 bg-white/8 p-4">
                <p className="text-sm font-semibold text-white/60">Rounds</p>
                <p className="mt-2 text-3xl font-black text-white">
                  {setup?.requiredRounds ?? 0}
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-white/8 p-4">
                <p className="text-sm font-semibold text-white/60">
                  Facts in room
                </p>
                <p className="mt-2 text-3xl font-black text-white">
                  {totalFacts}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export const FriendFactsPlayerSetup = () => {
  const { players } = useLobbyPlayer();
  const { setup, submitFacts } = useFriendFactsPlayer();
  const [facts, setFacts] = useState<string[]>([""]);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const submittedFacts =
      setup?.submittedFacts?.map((fact) => fact.text) ?? [];
    const normalizedIncoming = submittedFacts.length ? submittedFacts : [""];

    setFacts((current) => {
      if (
        current.length === normalizedIncoming.length &&
        current.every((fact, index) => fact === normalizedIncoming[index])
      ) {
        return current;
      }

      if (!submittedFacts.length && current.some((fact) => fact.trim().length > 0)) {
        return current;
      }

      return normalizedIncoming;
    });

    setSubmitted(submittedFacts.length > 0);
  }, [setup?.submittedFacts]);

  const playerCount = players.length;
  const submittedCount = setup?.readyPlayerIds.length ?? 0;
  const allSubmitted = playerCount > 0 && submittedCount === playerCount;
  const canSubmit = facts.some((fact) => fact.trim().length > 0);
  const maxFacts = 3;
  const canAddFact = facts.length < maxFacts;

  if (allSubmitted) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-8 px-4 py-6 text-center">
        <h2 className="text-4xl font-black tracking-tight text-white md:text-5xl">
          Waiting for host to start the game…
        </h2>
        <p className="text-lg text-white/70">
          All players have submitted their facts.
        </p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-8 px-4 py-6 text-center">
        <h2 className="text-4xl font-black tracking-tight text-white md:text-5xl">
          Facts submitted!
        </h2>
        <p className="text-lg text-white/70">Waiting for other players…</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 px-4 py-6">
      <div className="text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/60">
          Submit Facts
        </p>
        <h2 className="mt-3 text-4xl font-black tracking-tight text-white md:text-5xl">
          Add facts about yourself
        </h2>
      </div>

      <div className="w-full max-w-3xl rounded-xl border border-white/12 bg-black/15 p-5">
        <div className="grid gap-3">
          {facts.map((fact, index) => (
            <div
              key={index}
              className="flex items-center gap-2 rounded-[1.25rem] border border-white/10 bg-white/8 p-2"
            >
              <Input
                value={fact}
                onChange={(event) =>
                  setFacts((current) =>
                    current.map((entry, currentIndex) =>
                      currentIndex === index ? event.target.value : entry,
                    ),
                  )
                }
                placeholder={`Fact ${index + 1}`}
                className="border-0 bg-transparent text-white placeholder:text-white/35"
              />
              {facts.length > 1 && (
                <button
                  type="button"
                  className="rounded-xl p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
                  onClick={() =>
                    setFacts((current) => current.filter((_, i) => i !== index))
                  }
                >
                  <Trash2Icon className="size-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <Fbutton
            type="button"
            variant="outline"
            disabled={!canAddFact}
            onClick={() => setFacts((current) => [...current, ""])}
          >
            {canAddFact ? "Add Fact" : "3 Facts Max"}
          </Fbutton>
          <Fbutton
            type="button"
            disabled={!canSubmit}
            onClick={() => {
              submitFacts(
                facts
                  .map((text) => text.trim())
                  .filter(Boolean)
                  .map((text) => ({ text })),
              );
              setSubmitted(true);
            }}
          >
            Save Facts
          </Fbutton>
        </div>
      </div>
    </div>
  );
};

const ChoiceCard = ({
  name,
  avatar,
  selected,
  revealed,
  count,
  onClick,
  disabled,
}: {
  name: string;
  avatar?: string;
  selected?: boolean;
  revealed?: boolean;
  count?: number;
  onClick?: () => void;
  disabled?: boolean;
}) => {
  return (
    <div
      className={cn(
        "flex gap-4 bg-white/20 border-2 border-white/50 rounded-xl w-full p-3 items-center cursor-pointer select-none transition",
        selected &&
          "ring-2 ring-emerald-400 border-emerald-400 bg-emerald-400/10",
        disabled &&
          !selected &&
          "opacity-20 cursor-not-allowed hover:bg-white/20",
      )}
      onClick={() => {
        if (disabled || selected || !onClick) return;
        onClick();
      }}
    >
      <motion.div className="flex flex-col items-center">
        <PlayerAvatar
          displayName={name}
          avatar={avatar ?? ""}
          className="size-12 mb-0"
          showName={false}
        />
      </motion.div>
      <div className="flex-1 flex flex-col">
        <p className="text-xl font-semibold">{name}</p>
        {typeof count === "number" && revealed && (
          <span className="mt-1 inline-block rounded-full bg-black/25 px-2 py-1 text-sm font-bold text-white">
            {count} votes
          </span>
        )}
      </div>
    </div>
  );
};

export const FriendFactsHostRound = () => {
  const { lobby } = useLobbyHost();
  const { round, state, counts, nextRound } = useFriendFactsHost();

  return (
    <Fragment>
      <div className="fixed top-0 px-8 py-4 w-full">
        <div className="flex items-center justify-between w-full">
          <div className="">
            <p className="text-xl font-medium">
              <span className="font-bold ">{lobby?.name}</span> Code:{" "}
              {lobby?.code}
            </p>
            <p className="text-xl font-bold">
              Round {round?.number} of {round?.totalRounds}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {state === "ROUND_END" && (
              <Fbutton className="max-w-40 mx-auto w-full" onClick={nextRound}>
                Next
              </Fbutton>
            )}
            <EndGameButton />
          </div>
        </div>
      </div>

      <div className="flex h-full flex-col justify-center gap-8 px-4 py-6">
        <div className="mx-auto w-full max-w-5xl rounded-xl border border-white/12 bg-black/15 p-6 text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/55">
            Friend Fact
          </p>
          <h2 className="mt-4 text-4xl font-black tracking-tight text-white md:text-5xl">
            {round?.fact}
          </h2>
        </div>

        {/* Voting progress */}
        {state === "ROUND" && round && (
          <div className="mx-auto w-full max-w-4xl mb-4">
            <p className="text-center text-xl font-semibold mb-2">
              {counts
                ? Object.values(counts).reduce((sum, value) => sum + value, 0)
                : 0}
              /{round.choices.length > 0 ? round.choices.length - 1 : 0} voted
            </p>
            <Timer duration={round.duration} startTime={round.startedAt} />
          </div>
        )}

        <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-4 md:grid-cols-2">
          {round?.choices.map((choice) => (
            <ChoiceCard
              key={choice.id}
              name={choice.displayName}
              selected={
                state === "ROUND_END" && round.answerPlayerId === choice.id
              }
              revealed={state === "ROUND_END"}
              count={counts?.[choice.id] ?? 0}
            />
          ))}
        </div>
      </div>
    </Fragment>
  );
};

export const FriendFactsPlayerRound = () => {
  const { round, myAnswer, submitAnswer } = useFriendFactsPlayer();
  const { player } = useLobbyPlayer();

  if (round?.isFactOwner) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-6 px-4 py-6 text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/60">
          Your Fact
        </p>
        <h2 className="max-w-3xl text-4xl font-black tracking-tight text-white md:text-5xl">
          {round.fact}
        </h2>
        <p className="text-lg font-semibold text-white/75">
          Sit this round out. You score whatever the top correct guess earns.
        </p>
        <div className="w-full max-w-4xl">
          <Timer duration={round.duration} startTime={round.startedAt} />
        </div>
      </div>
    );
  }

  // Hide self from voting pool
  const filteredChoices =
    round?.choices.filter((choice) => choice.id !== player?.id) ?? [];

  return (
    <div className="flex h-full flex-col items-center justify-center gap-8 px-4 py-6">
      <div className="mx-auto w-full max-w-5xl rounded-xl border border-white/12 bg-black/15 p-6 text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/55">
          Who is this about?
        </p>
        <h2 className="mt-4 text-4xl font-black tracking-tight text-white md:text-5xl">
          {round?.fact}
        </h2>
      </div>

      {/* Voting progress */}
      {round && (
        <div className="w-full max-w-4xl mb-4">
          <p className="text-center text-xl font-semibold mb-2">
            {myAnswer ? 1 : 0}/
            {round.choices.length > 0 ? round.choices.length - 1 : 0} voted
          </p>
          <Timer duration={round.duration} startTime={round.startedAt} />
        </div>
      )}

      <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-4 md:grid-cols-2">
        {filteredChoices.map((choice) => (
          <ChoiceCard
            key={choice.id}
            name={choice.displayName}
            selected={myAnswer === choice.id}
            onClick={myAnswer ? undefined : () => submitAnswer(choice.id)}
            disabled={!!myAnswer}
          />
        ))}
      </div>
    </div>
  );
};

export const FriendFactsPlayerRoundEnd = () => {
  const { player } = useLobbyPlayer();
  const { round, scores } = useFriendFactsPlayer();
  const myScore = scores.find((entry) => entry.id === player?.id)?.score ?? 0;

  return (
    <div className="flex h-full flex-col items-center justify-center gap-8 px-4 py-6 text-center">
      <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/60">
        Round Over
      </p>
      <h2 className="max-w-3xl text-4xl font-black tracking-tight text-white md:text-5xl">
        {round?.fact}
      </h2>
      <div className="rounded-xl border border-white/12 bg-black/15 px-8 py-6">
        <p className="text-sm font-semibold text-white/60">Score</p>
        <p className="mt-2 text-5xl font-black text-white">{myScore}</p>
      </div>
      <ScoreGapHint scores={scores} />
    </div>
  );
};
