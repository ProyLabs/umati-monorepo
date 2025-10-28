// lib/guest.ts
export async function createGuest(displayName?: string, avatar?: string) {
  const res = await fetch("/api/guests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ displayName, avatar }),
  });

  if (!res.ok) throw new Error("Failed to create guest");
  return res.json();
}
