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
    <Card className="z-50 rounded-2xl max-w-md w-full">
      <CardHeader>
        <CardTitle className="text-xl md:text-3xl font-bold">
          Join a Lobby
        </CardTitle>
        <CardDescription>
          Join your friends by entering the 6-digit lobby code below.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="grid gap-4">
          <div className="space-y-6">
            <InputOTP
              maxLength={6}
              value={lobbyCode}
              onChange={async (value) => {
               await setLobbyCode(value)
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
            variant="sky"
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
