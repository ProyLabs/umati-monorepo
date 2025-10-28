// app/api/lobbies/[id]/kick/route.ts
import { wsServer } from "../../../../../lib/ws/server";
import { WSEvent } from "../../../../../lib/ws/events";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  context: { params: Promise<{ identifier: string }> }
) {
  const { identifier: roomId } = await context.params;
  const { playerId } = await req.json();

  // Optional: database logic to remove player from lobby

  // 🔥 Notify & disconnect the player
  wsServer.kickPlayer(roomId, playerId);

  return NextResponse.json({ success: true });
}
