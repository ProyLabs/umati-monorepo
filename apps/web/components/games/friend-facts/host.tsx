import { BeforeWeBegin } from "@/components/lobby/widgets";
import { useFriendFactsHost } from "@/providers/games/friend-facts/friend-facts-host-provider";
import { Leaderboard, Podium } from "../shared";
import { FriendFactsHostRound, FriendFactsHostSetup } from "./widgets";

export default function FriendFactsHost() {
  const { state, scores, nextRound } = useFriendFactsHost();

  if (state === "BEFORE") return <BeforeWeBegin />;
  if (state === "ROUND_SETUP") return <FriendFactsHostSetup />;
  if (state === "ROUND" || state === "ROUND_END") return <FriendFactsHostRound />;
  if (state === "LEADERBOARD")
    return <Leaderboard scores={scores} nextRound={nextRound} />;
  if (state === "RANKING") return <Podium scores={scores} nextRound={nextRound} />;

  return "";
}
