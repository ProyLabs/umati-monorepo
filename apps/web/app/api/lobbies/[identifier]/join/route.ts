import { prisma } from "@umati/prisma";
import { WSEvent } from "@/lib/ws/events";
import { WSManager } from "@/lib/ws/manager";
import { toWirePlayer } from "@/lib/ws/utils";
import { NextResponse } from "next/server";

interface JoinLobbyBody {
  id?: string;
  type?: "guest" | "user";
  displayName: string;
  avatar?: string;
  pin?: string;
}

export async function POST(
  req: Request,
  context: { params: Promise<{ identifier: string }> }
) {
  const { identifier } = await context.params;

  try {
    const body = (await req.json()) as JoinLobbyBody;
    const { id, type, displayName, avatar, pin } = body;

    // 🧱 Basic validation
    if (!id || !displayName || !type) {
      return NextResponse.json(
        { error: "Missing required fields: id, displayName, or type." },
        { status: 400 }
      );
    }

    if (!["user", "guest"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid player type." },
        { status: 400 }
      );
    }

    const trimmedName = displayName.trim();
    if (!trimmedName.length) {
      return NextResponse.json(
        { error: "Display name cannot be empty." },
        { status: 400 }
      );
    }

    // 1️⃣ Find lobby
    const lobby = await prisma.lobby.findUnique({
      where: { lobbyIdentifier: identifier },
      include: { players: true },
    });

    if (!lobby) {
      return NextResponse.json({ error: "Lobby not found." }, { status: 404 });
    }

    // 2️⃣ Check private + PIN
    if (lobby.private) {
      if (!pin || pin !== lobby.pin) {
        return NextResponse.json(
          { error: "Invalid or missing PIN for private lobby." },
          { status: 403 }
        );
      }
    }

    // 3️⃣ Check max players
    if (lobby.players.length >= lobby.maxPlayers) {
      return NextResponse.json({ error: "Lobby is full." }, { status: 403 });
    }

    // 4️⃣ Prevent duplicates
    const existing = await prisma.lobbyPlayer.findFirst({
      where:
        type === "user"
          ? { lobbyId: lobby.id, userId: id }
          : { lobbyId: lobby.id, guestId: id },
    });

    if (existing) {
      return NextResponse.json(
        { error: "You are already in this lobby." },
        { status: 400 }
      );
    }

    // 5️⃣ Create player
    const player = await prisma.lobbyPlayer.create({
      data: {
        lobbyId: lobby.id,
        displayName: trimmedName,
        avatar: avatar?.trim() || "🙂",
        userId: type === "user" ? id : null,
        guestId: type === "guest" ? id : null,
      },
    });

    // 🔹 Build wire player & broadcast full payload to hosts
    const wirePlayer = toWirePlayer(player);
    WSManager.broadcastToHosts(lobby.lobbyIdentifier, WSEvent.PLAYER_JOINED, {
      ...wirePlayer
    });

    // 6️⃣ Fetch updated lobby
    const updatedLobby = await prisma.lobby.findUnique({
      where: { id: lobby.id },
      include: {
        players: {
          select: {
            id: true,
            displayName: true,
            avatar: true,
            userId: true,
            guestId: true,
          },
        },
      },
    });

    const players = lobby.players.map((p) => {
      const isUser = !!p.userId;
      const profileId = isUser ? p.userId : p.guestId;
      return {
        playerId: profileId ?? p.id,
        displayName: p?.displayName,
        avatar: p?.avatar,
        type: isUser ? "user" : "guest",
      };
    });

    const response = {
      lobby: {
        ...updatedLobby,
        players,
      },
      player: {
        playerId: !!player.userId ? player.userId : player.guestId,
        displayName: player.displayName,
        avatar: player.avatar,
        type: !!player.userId ? "user" : "guest",
      },
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error("❌ Error joining lobby:", err);
    return NextResponse.json(
      { error: "Failed to join lobby." },
      { status: 500 }
    );
  }
}
