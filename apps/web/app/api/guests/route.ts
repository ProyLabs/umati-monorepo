import { prisma } from "../../../lib/prisma";

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
