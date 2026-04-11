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
import { cn } from "@/lib/utils";
import { Separator } from "../ui/separator";

const maxLobbyPlayers = Number(process.env.NEXT_PUBLIC_MAX_LOBBY_PLAYERS ?? 60);
const lobbySizeOptions = Array.from(
  new Set(
    [10, 20, 40, maxLobbyPlayers].filter(
      (value) => value >= 2 && value <= maxLobbyPlayers,
    ),
  ),
).sort((left, right) => left - right);

export default function CreateLobby() {
  const [lobbyName, setLobbyName] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(Math.min(20, maxLobbyPlayers));
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [pageLoader, setPageLoader] = useState(false);
  const { user } = useAuth();

  async function handleCreate(isPrivate = false, pin?: string) {
    if(!lobbyName){
      return toast.error("Lobby Name is required");
    }


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

      setPageLoader(true);
      const { lobby } = await res.json();
      if (lobby) {
        router.push(`/lobby/${lobby.lobbyIdentifier}/host`);
      } else {
        setPageLoader(false);
        throw new Error("Lobby creation failed");
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong!", {});
    } finally {
      setLoading(false);
    }
  }

  if (pageLoader) {
    return (
      <svg
        height={128}
        width={128}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 200 200"
        className={cn("animate-pulse")}
      >
        <rect
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="15"
          strokeLinejoin="round"
          width="30"
          height="30"
          x="85"
          y="85"
          rx="0"
          ry="0"
        >
          <animate
            attributeName="rx"
            calcMode="spline"
            dur="2"
            values="15;15;5;15;15"
            keySplines=".5 0 .5 1;.8 0 1 .2;0 .8 .2 1;.5 0 .5 1"
            repeatCount="indefinite"
          ></animate>
          <animate
            attributeName="ry"
            calcMode="spline"
            dur="2"
            values="15;15;10;15;15"
            keySplines=".5 0 .5 1;.8 0 1 .2;0 .8 .2 1;.5 0 .5 1"
            repeatCount="indefinite"
          ></animate>
          <animate
            attributeName="height"
            calcMode="spline"
            dur="2"
            values="30;30;1;30;30"
            keySplines=".5 0 .5 1;.8 0 1 .2;0 .8 .2 1;.5 0 .5 1"
            repeatCount="indefinite"
          ></animate>
          <animate
            attributeName="y"
            calcMode="spline"
            dur="2"
            values="40;170;40;"
            keySplines=".6 0 1 .4;0 .8 .2 1"
            repeatCount="indefinite"
          ></animate>
        </rect>
      </svg>
    );
  }

  return (
    <Card className="z-50 max-w-md w-full relative isolate  overflow-clip overflow-x-visible rounded-[2rem] border border-white/12 bg-[linear-gradient(135deg,rgba(255,255,255,0.09),rgba(255,255,255,0.03))] shadow-[0_24px_80px_rgba(255,255,255,0.08)] backdrop-blur-xl">
      <div className="h-full w-full absolute inset-0 overflow-clip rounded-[2rem] ">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,202,40,0.16),transparent_28%),radial-gradient(circle_at_top_right,rgba(77,199,255,0.16),transparent_32%),radial-gradient(circle_at_bottom,rgba(106,59,255,0.16),transparent_34%)]" />
        <div className="absolute -left-10 top-8 h-28 w-28 rounded-full bg-[var(--umati-yellow)]/12 blur-3xl" />
        <div className="absolute right-0 top-0 h-36 w-36 translate-x-1/4 -translate-y-1/4 rounded-full bg-[var(--umati-sky)]/12 blur-3xl" />
      </div>

      <CardHeader className="relative">
        <CardTitle className="text-xl md:text-3xl font-bold mb-0">
          Create Lobby
        </CardTitle>
        <CardDescription className="">
          Create a lobby and have fun with your friends!
        </CardDescription>
      </CardHeader>
      <CardContent className="relative">
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
              options={lobbySizeOptions}
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

          <Separator />

          <Link href="/join-lobby" className="w-full">
            <Fbutton
              variant="outline"
              className="w-full"
              onClick={async () => {}}
            >
              Join a Lobby
            </Fbutton>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
