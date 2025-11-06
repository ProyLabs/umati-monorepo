import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { status, userId, timestamp } = await req.json();

//   // Store in your database
//   await db.cookieConsent.create({
//     data: { userId, status, timestamp },
//   });

  return NextResponse.json({ success: true });
}
