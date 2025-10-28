// lib/ws/format.ts
import type { Player } from "@/lib/types/lobby-shared";

export function toWirePlayer(p: {
  userId: string | null;
  guestId: string | null;
  displayName: string;
  avatar: string | null;
}): Player {
  const playerId = p.userId ?? p.guestId!; // one must exist by schema
  return {
    playerId,
    displayName: p.displayName,
    avatar: p.avatar ?? "🙂",
    type: p.userId ? "user" : "guest",
  };
}
