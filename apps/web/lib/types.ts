export interface NormalizedPlayer {
  playerId: string;
  userId?: string | null;
  guestId?: string | null;
  displayName: string;
  avatar?: string;
  score?: number;
  type: "user" | "guest";
}