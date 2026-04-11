import { BeforeWeBegin } from "@/components/lobby/widgets";
import { useCodenamesHost } from "@/providers/games/codenames/codenames-host-provider";
import {
  CodenamesHostResult,
  CodenamesHostRound,
  CodenamesHostSetup,
  CodenamesTitleScreen,
} from "./widgets";

export default function CodenamesHost() {
  const { state } = useCodenamesHost();

  if (state === "BEFORE") return <BeforeWeBegin />;
  if (state === "ROUND_SETUP") return <CodenamesHostSetup />;
  if (state === "ROUND") return <CodenamesHostRound />;
  if (state === "RANKING") return <CodenamesHostResult />;

  return <CodenamesTitleScreen />;
}
