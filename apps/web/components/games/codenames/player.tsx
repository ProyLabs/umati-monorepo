import { useCodenamesPlayer } from "@/providers/games/codenames/codenames-player-provider";
import {
  CodenamesPlayerResult,
  CodenamesPlayerRound,
  CodenamesPlayerSetup,
  CodenamesTitleScreen,
} from "./widgets";

export default function CodenamesPlayer() {
  const { state } = useCodenamesPlayer();

  if (state === "BEFORE") return <CodenamesTitleScreen />;
  if (state === "ROUND_SETUP") return <CodenamesPlayerSetup />;
  if (state === "ROUND") return <CodenamesPlayerRound />;
  if (state === "RANKING") return <CodenamesPlayerResult />;

  return <CodenamesTitleScreen />;
}
