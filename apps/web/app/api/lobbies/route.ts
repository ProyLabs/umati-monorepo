import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { customAlphabet } from "nanoid";

interface CreateLobbyBody {
  name: string;
  maxPlayers?: number;
  hostGuestId?: string;
  hostUserId?: string;
  private?: boolean;
  pin?: string;
}

// 🧠 Generate readable identifiers
const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const numbers = "0123456789";
const nanoidAlphabet = customAlphabet(alphabet, 8);
const nanoidNumbers = customAlphabet(numbers, 6);

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CreateLobbyBody;
    const {
      name,
      maxPlayers,
      hostGuestId,
      hostUserId,
      private: isPrivate,
      pin,
    } = body;

    // 🧩 Validation
    if (!name || name.trim().length < 2) {
      return NextResponse.json(
        { error: "Lobby name is required." },
        { status: 400 }
      );
    }

    if (!hostGuestId && !hostUserId) {
      return NextResponse.json(
        { error: "Either hostGuestId or hostUserId must be provided." },
        { status: 400 }
      );
    }

    if (isPrivate && !pin) {
      return NextResponse.json(
        { error: "Private lobbies must include a PIN." },
        { status: 400 }
      );
    }

    const maxAllowed = maxPlayers ?? 8;
    if (maxAllowed < 2 || maxAllowed > 20) {
      return NextResponse.json(
        { error: "maxPlayers must be between 2 and 20." },
        { status: 400 }
      );
    }

    const lobbyIdentifier = nanoidAlphabet();
    const code = nanoidNumbers();

    // 🏗️ Create Lobby
    const lobby = await prisma.lobby.create({
      data: {
        name: name.trim(),
        maxPlayers: maxAllowed,
        lobbyIdentifier,
        code,
        private: isPrivate || false,
        pin: isPrivate ? pin : null,
        hostGuestId: hostGuestId || null,
        hostUserId: hostUserId || null,
      },
    });


    // ✅ Response
    return NextResponse.json({
      lobby: {
        id: lobby.id,
        name: lobby.name,
        maxPlayers: lobby.maxPlayers,
        lobbyIdentifier: lobby.lobbyIdentifier,
        code: lobby.code,
        private: lobby.private,
        createdAt: lobby.createdAt,
      },
    });
  } catch (err: any) {
    console.error("❌ Error creating lobby:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
