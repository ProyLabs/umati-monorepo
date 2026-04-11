import { BeforeWeBegin } from "@/components/lobby/widgets";
import { Leaderboard, Podium } from "../shared";
import { useDrawItHost } from "@/providers/games/drawit/drawit-host-provider";
import { DrawItHostRound, DrawItHostSetup, DrawItTitleScreen } from "./widgets";

export default function DrawItHost() {
  const { state, scores, nextRound } = useDrawItHost();

  if (state === "BEFORE") return <BeforeWeBegin />;
  if (state === "ROUND_SETUP") return <DrawItHostSetup />;
  if (state === "ROUND" || state === "ROUND_END") return <DrawItHostRound />;
  if (state === "LEADERBOARD") return <Leaderboard scores={scores} nextRound={nextRound} />;
  if (state === "RANKING") return <Podium scores={scores} nextRound={nextRound} />;

  return <DrawItTitleScreen />;
}
