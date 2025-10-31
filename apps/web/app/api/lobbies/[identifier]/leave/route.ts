import { prisma } from "@umati/prisma";
import { NextResponse } from "next/server";

interface LeaveLobbyBody {
  id?: string;
  type?: "guest" | "user";
}

export async function POST(
  req: Request,
  context: { params: Promise<{ identifier: string }> }
) {
  const { identifier } = await context.params;

  try {
    const body = (await req.json()) as LeaveLobbyBody;
    const { id, type } = body;

    if (!id || !type) {
      return NextResponse.json(
        { error: "Missing required fields: id or type" },
        { status: 400 }
      );
    }

    const lobby = await prisma.lobby.findUnique({
      where: { lobbyIdentifier: identifier },
    });

    if (!lobby)
      return NextResponse.json({ error: "Lobby not found" }, { status: 404 });

    const player = await prisma.lobbyPlayer.findFirst({
      where:
        type === "user"
          ? { lobbyId: lobby.id, userId: id }
          : { lobbyId: lobby.id, guestId: id },
    });

    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    await prisma.lobbyPlayer.delete({
      where: { id: player.id },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ Error leaving lobby:", err);
    return NextResponse.json(
      { error: "Failed to leave lobby" },
      { status: 500 }
    );
  }
}
