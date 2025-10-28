"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { useAuth } from "../../providers/auth-provider";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import ButtonOptions from "../ui/button-options";
import { Fbutton } from "../ui/fancy-button";

export default function CreateLobby() {
  const [lobbyName, setLobbyName] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(8);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  async function handleCreate(isPrivate = false, pin?: string) {
    try {
      setLoading(true);
      const data = {
        hostGuestId: "",
        hostUserId: "",
        name: lobbyName,
        maxPlayers,
        private: isPrivate,
        pin,
      };
      if (user?.type === "guest") {
        data["hostGuestId"] = user.id;
      } else if (user?.type === "user") {
        data["hostUserId"] = user!.id;
      }

      const res = await fetch("/api/lobbies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create lobby");
      }

      const { lobby } = await res.json();
      if (lobby) {
        router.push(`/lobby/${lobby.lobbyIdentifier}/host`);
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong!", {});
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="z-50 rounded-2xl max-w-md w-full">
      <CardHeader>
        <CardTitle className="text-xl md:text-3xl font-bold">
          Create Lobby
        </CardTitle>
        <CardDescription className="">
          Create a lobby and have fun with your friends!
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="lobby-name">Name your Lobby</Label>
            <Input
              id="lobby-name"
              placeholder="Type here..."
              required
              onChange={(e) => {
                setLobbyName(e.target.value);
              }}
              value={lobbyName}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="maxPlayers">Max Number of Players</Label>
            <ButtonOptions
              value={maxPlayers}
              onChange={(value) => setMaxPlayers(Number(value))}
              options={[4, 8, 10]}
            />
          </div>

          <Fbutton
            type="submit"
            className="w-full mt-6"
            loading={loading}
            onClick={async () => {
              await handleCreate();
            }}
          >
            Create Lobby
          </Fbutton>
        </div>
      </CardContent>
      <CardFooter>
        <div className="flex justify-center w-full border-t py-4">
          <Link href="/join-lobby" className="w-full">
            <Fbutton
              variant="secondary"
              className="w-full"
              onClick={async () => {}}
            >
              Join a Lobby
            </Fbutton>
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
