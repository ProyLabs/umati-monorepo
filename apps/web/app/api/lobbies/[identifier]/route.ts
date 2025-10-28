import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth"; // Better Auth
import type { PlayerType } from "@/lib/types/lobby-shared";

/**
 * GET /api/lobbies/[identifier]
 * Returns a normalized, viewer-agnostic lobby snapshot.
 */
export async function GET(
  req: Request,
  context: { params: Promise<{ identifier: string }> }
) {
  const { identifier } = await context.params;

  try {
    // 🧩 Get optional user/guest info — just for context, not to affect output
    const session = await auth.api.getSession({ headers: req.headers });
    const userId = session?.user?.id ?? null;
    const guestId = req.headers.get("x-guest-id");

    // 🗄️ Fetch lobby from DB with host + players
    const lobby = await prisma.lobby.findUnique({
      where: { lobbyIdentifier: identifier },
      include: {
        hostUser: { select: { id: true, name: true, avatarUrl: true } },
        hostGuest: { select: { id: true, displayName: true, avatar: true } },
        players: {
          include: {
            user: { select: { id: true, name: true, avatarUrl: true } },
            guest: { select: { id: true, displayName: true, avatar: true } },
          },
        },
      },
    });

    if (!lobby) {
      return NextResponse.json({ error: "Lobby not found" }, { status: 404 });
    }

    // 🧠 Determine host info
    const hostType: PlayerType = lobby.hostUserId ? "user" : "guest";
    const hostId = lobby.hostUserId ?? lobby.hostGuestId!;

    // 👥 Normalize player data
    const players = lobby.players.map((p) => {
      const isUser = !!p.userId;
      const profile = isUser ? p.user : p.guest;
      return {
        playerId: profile?.id ?? p.id,
        displayName: p?.displayName,
        avatar: p?.avatar,
        type: isUser ? "user" : "guest",
      };
    });

    // 🎁 Format response
    const response = {
      id: lobby.id,
      name: lobby.name,
      code: lobby.code,
      lobbyIdentifier: lobby.lobbyIdentifier,
      private: lobby.private,
      maxPlayers: lobby.maxPlayers,
      hostId,
      hostType,
      state: "WAITING", // replace with column if you add state later
      players,
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error("❌ Error fetching lobby:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
