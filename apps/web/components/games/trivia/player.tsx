import React, { useMemo } from "react";
import {
  Option,
  OptionLetter,
  PlayerOption,
  PlayerOptions,
  Question,
  Timer,
} from "./widgets";
import { Fbutton } from "../../ui/fancy-button";
import { Leaderboard, Podium } from "../shared";
import { useLobbyPlayer } from "@/providers/lobby-player-provider";

export default function TriviaPlayer() {
  const { game, gameState, lobby, sendAnswer } = useLobbyPlayer();
  const data = useMemo(() => {
    return game?.data[game?.currentRound]!;
  }, [game]);
  const letters: OptionLetter[] = ["A", "B", "C", "D"];
  return (
    <div className="bg-gradient-to-br from-[#FE566B] to-[var(--umati-red)] h-dvh w-dvw">
      {/* <Leaderboard /> */}

      {/* <Podium /> */}

      <div className="flex flex-col items-center justify-center h-full gap-16">
        <h6 className="text-3xl font-bold">Round {game?.currentRound! + 1}</h6>

        <PlayerOptions
          options={data.choices.map((choice, index) => ({
            letter: letters[index],
            text: choice,
          }))}
          onSelect={(letter) =>
            sendAnswer(letters.indexOf(letter) as 0 | 1 | 2 | 3)
          }
        />
      </div>
    </div>
  );
}
