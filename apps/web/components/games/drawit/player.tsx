import { PlayerPodium } from "../shared";
import { useDrawItPlayer } from "@/providers/games/drawit/drawit-player-provider";
import {
  DrawItPlayerRound,
  DrawItPlayerSetup,
  DrawItPlayerTurnEnd,
  DrawItTitleScreen,
} from "./widgets";

export default function DrawItPlayer() {
  const { state, scores } = useDrawItPlayer();

  if (state === "BEFORE") return <DrawItTitleScreen />;
  if (state === "ROUND_SETUP") return <DrawItPlayerSetup />;
  if (state === "ROUND") return <DrawItPlayerRound />;
  if (state === "ROUND_END" || state === "LEADERBOARD") return <DrawItPlayerTurnEnd />;
  if (state === "RANKING") return <PlayerPodium scores={scores} />;

  return <DrawItTitleScreen />;
}
