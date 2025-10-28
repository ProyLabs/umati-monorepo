import { wsServer } from "@/lib/ws/server";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  context: { params: Promise<{ identifier: string }> }
) {
  const { identifier } = await context.params;


  // ... your logic for closing the room in DB ...

  // 🔥 Close all sockets & broadcast event
  wsServer.closeRoom(identifier);

  return NextResponse.json({ success: true });
}
