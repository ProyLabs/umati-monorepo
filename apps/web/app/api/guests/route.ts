import { prisma } from "@umati/prisma";

export async function POST(req: Request) {
  const { displayName, avatar } = await req.json();

  const guest = await prisma.guest.create({
    data: {
      displayName: displayName || null,
      avatar: avatar || null,
    },
    select: { id: true, displayName: true, avatar: true },
  });

  return Response.json(guest);
}
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return Response.json({ error: "Missing id parameter" }, { status: 400 });
  }

  const guest = await prisma.guest.findUnique({
    where: { id },
    select: { id: true, displayName: true, avatar: true },
  });

  if (!guest) {
    return Response.json({ error: "Guest not found" }, { status: 404 });
  }

  return Response.json(guest);
}
