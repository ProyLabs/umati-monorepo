import { PlayerPodium } from "../shared";
import { useFriendFactsPlayer } from "@/providers/games/friend-facts/friend-facts-player-provider";
import {
  FriendFactsPlayerRound,
  FriendFactsPlayerRoundEnd,
  FriendFactsPlayerSetup,
  FriendFactsTitleScreen,
} from "./widgets";

export default function FriendFactsPlayer() {
  const { state, scores } = useFriendFactsPlayer();

  if (state === "BEFORE") return <FriendFactsTitleScreen />;
  if (state === "ROUND_SETUP") return <FriendFactsPlayerSetup />;
  if (state === "ROUND") return <FriendFactsPlayerRound />;
  if (state === "ROUND_END" || state === "LEADERBOARD")
    return <FriendFactsPlayerRoundEnd />;
  if (state === "RANKING") return <PlayerPodium scores={scores} />;

  return "";
}
