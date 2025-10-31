import { NextResponse } from "next/server";
import { prisma } from "@umati/prisma";


export async function GET(
  req: Request,
  context: { params: Promise<{ code: string }> }
) {
  const { code } = await context.params;
  const lobby = await prisma.lobby.findUnique({
    where: { code: code },
    select: {
      lobbyIdentifier: true,
      name: true,
      private: true,
      maxPlayers: true,
    },
  });

  if (!lobby)
    return NextResponse.json({ error: "Lobby not found" }, { status: 404 });

  return NextResponse.json(lobby);
}
