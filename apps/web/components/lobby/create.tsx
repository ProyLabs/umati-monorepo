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

export default function CreateLobby() {
  const [lobbyName, setLobbyName] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(20);
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
              variant="outline"
              value={maxPlayers}
              onChange={(value) => setMaxPlayers(Number(value))}
              options={[10, 20, 40, 60]}
            />
          </div>

          <Fbutton
            type="submit"
            className="w-full mt-6"
            variant="purple"
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
              variant="outline"
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
