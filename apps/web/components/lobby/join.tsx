"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Fbutton } from "../ui/fancy-button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "../ui/input-otp";

export default function JoinLobby() {
  const [lobbyCode, setLobbyCode] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleJoin() {
    if (!lobbyCode.trim()) {
      toast.error("Please enter a lobby code");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/lobbies/by-code/${lobbyCode.trim()}`);

      if (!res.ok) {
        if (res.status === 404) {
          toast.error("Lobby not found");
        } else {
          toast.error("Something went wrong. Please try again.");
        }
        setLoading(false);
        return;
      }

      const data = await res.json();
      if (data.lobbyIdentifier) {
        // ✅ Redirect to lobby page
        router.push(`/lobby/${data.lobbyIdentifier}`);
      } else {
        toast.error("Invalid response from server");
        setLoading(false);
      }
    } catch (err) {
      console.error("Error joining lobby:", err);
      toast.error("Could not connect to server");
      setLoading(false);
    }
  }

  useEffect(() => {
   if (lobbyCode.length < 6) return;
  handleJoin();

  }, [lobbyCode])
  

  return (
    <Card className="z-50 max-w-md w-full relative isolate  overflow-clip overflow-x-visible rounded-[2rem] border border-white/12 bg-[linear-gradient(135deg,rgba(255,255,255,0.09),rgba(255,255,255,0.03))] shadow-[0_24px_80px_rgba(255,255,255,0.08)] backdrop-blur-xl">
      <div className="h-full w-full absolute inset-0 overflow-clip rounded-[2rem] ">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,202,40,0.16),transparent_28%),radial-gradient(circle_at_top_right,rgba(77,199,255,0.16),transparent_32%),radial-gradient(circle_at_bottom,rgba(106,59,255,0.16),transparent_34%)]" />
        <div className="absolute -left-10 top-8 h-28 w-28 rounded-full bg-[var(--umati-yellow)]/12 blur-3xl" />
        <div className="absolute right-0 top-0 h-36 w-36 translate-x-1/4 -translate-y-1/4 rounded-full bg-[var(--umati-sky)]/12 blur-3xl" />
      </div>
      <CardHeader className="relative">
        <CardTitle className="text-xl md:text-3xl font-bold">
          Join a Lobby
        </CardTitle>
        <CardDescription>
          Join your friends by entering the 6-digit lobby code below.
        </CardDescription>
      </CardHeader>

      <CardContent className="relative">
        <div className="grid gap-4">
          <div className="space-y-6">
            <InputOTP
              maxLength={6}
              value={lobbyCode}
              onChange={async (value) => {
                await setLobbyCode(value);
              }}
            >
              <InputOTPGroup className="gap-2">
                <InputOTPSlot
                  index={0}
                  className="text-2xl font-bold"
                  aria-disabled={loading}
                />
                <InputOTPSlot
                  index={1}
                  className="text-2xl font-bold"
                  aria-disabled={loading}
                />
                <InputOTPSlot
                  index={2}
                  className="text-2xl font-bold"
                  aria-disabled={loading}
                />
                <InputOTPSlot
                  index={3}
                  className="text-2xl font-bold"
                  aria-disabled={loading}
                />
                <InputOTPSlot
                  index={4}
                  className="text-2xl font-bold"
                  aria-disabled={loading}
                />
                <InputOTPSlot
                  index={5}
                  className="text-2xl font-bold"
                  aria-disabled={loading}
                />
              </InputOTPGroup>
            </InputOTP>
          </div>

          <Fbutton
            type="submit"
            className="w-full"
            loading={loading}
            onClick={handleJoin}
          >
            Join Lobby
          </Fbutton>
        </div>
      </CardContent>

      <CardFooter>
        <div className="flex justify-center w-full border-t py-4">
          <Link href="/create-lobby" className="w-full">
            <Fbutton variant="outline" className="w-full" disabled={loading}>
              Create a Lobby
            </Fbutton>
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
