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
import { useState } from "react";
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
      }
    } catch (err) {
      console.error("Error joining lobby:", err);
      toast.error("Could not connect to server");
    } finally {
      setLoading(false);
    }
  }

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
          <div className="space">
            <InputOTP
              maxLength={6}
              value={lobbyCode}
              onChange={(value) => setLobbyCode(value)}
            >
              <InputOTPGroup className="justify-between w-full gap-2">
                <InputOTPSlot index={0} className="text-2xl font-bold h-14 max-w-3/4 w-full" />
                <InputOTPSlot index={1} className="text-2xl font-bold h-14 max-w-3/4 w-full" />
                <InputOTPSlot index={2} className="text-2xl font-bold h-14 max-w-3/4 w-full" />
                <InputOTPSlot index={3} className="text-2xl font-bold h-14 max-w-3/4 w-full" />
                <InputOTPSlot index={4} className="text-2xl font-bold h-14 max-w-3/4 w-full" />
                <InputOTPSlot index={5} className="text-2xl font-bold h-14 max-w-3/4 w-full" />
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
            <Fbutton variant="secondary" className="w-full" disabled={loading}>
              Create a Lobby
            </Fbutton>
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
