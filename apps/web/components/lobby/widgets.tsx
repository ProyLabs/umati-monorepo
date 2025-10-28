"use client";

import { RiHeart3Line, RiMedalFill } from "@remixicon/react";
import { cva, VariantProps } from "class-variance-authority";
import {
  Maximize2Icon,
  MaximizeIcon,
  MinimizeIcon,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  WifiHighIcon,
  WifiIcon,
  WifiLowIcon,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useTheme } from "next-themes";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import useClickOutside from "../../hooks/use-click-outside";
import { useClipboard } from "../../hooks/use-clipboard";
import { cn, getRandomAvatarUrl } from "../../lib/utils";
import { WSEvent } from "../../lib/ws/events";
import { useLobbyHost } from "../../providers/lobby-host-provider";
import { useLobbyPlayer } from "../../providers/lobby-player-provider";
import { useSettings } from "../../providers/settings-provider";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import AvatarSelect from "../ui/avatar-select";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Fbutton } from "../ui/fancy-button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import UmatiLogo, { UmatiFullLogo } from "../ui/logo";
import { Separator } from "../ui/separator";
import { QRCode } from "../ui/shadcn-io/qr-code";
import { Slider } from "../ui/slider";
import { useAuth } from "@/providers/auth-provider";

export const CopyLinkButton = () => {
  const { joinUrl } = useLobbyHost();
  const { copied, copy } = useClipboard(2500);
  return (
    <Fbutton
      type="button"
      variant="outline"
      className="w-full max-w-2xs"
      onClick={() => {
        copy(joinUrl);
      }}
    >
      {copied ? "Copied" : "Copy Link"}
    </Fbutton>
  );
};

export const SettingsBar = () => {
  const {
    volume,
    musicOn,
    fullscreen,
    toggleMusic,
    toggleFullscreen,
    setVolume,
  } = useSettings();

  const { theme, setTheme } = useTheme();
  const [show, setShow] = useState(false);
  const toggleShow = () => setShow((prev) => !prev);

  return (
    <div className="flex items-center gap-2 p-2 rounded-2xl bg-foreground/5 w-fit relative h-12">
      <Button variant="ghost" size="icon" onClick={toggleShow}>
        <Volume2 className="size-5" />
      </Button>
      {/* <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <Sun className="size-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
            <Moon className="absolute size-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel>Appearance</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
            <DropdownMenuRadioItem value="light">Light</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="dark">Dark</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="system">System</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu> */}

      <Button
        variant="ghost"
        onClick={toggleFullscreen}
        className="hidden md:inline-flex"
      >
        {fullscreen ? (
          <MinimizeIcon className="size-5" />
        ) : (
          <MaximizeIcon className="size-5" />
        )}
      </Button>

      <AnimatePresence>
        {show && (
          <motion.div
            key="settings-panel"
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="bg-foreground/5 w-60 min-h-20 border rounded-2xl absolute bottom-full mb-2 left-0 text-foreground p-3 flex flex-col gap-2 shadow-lg"
          >
            <Button
              variant="ghost"
              onClick={toggleMusic}
              className="w-full justify-start !px-2"
            >
              {musicOn ? (
                <Volume2 className="size-5" />
              ) : (
                <VolumeX className="size-5" />
              )}
              <span>{musicOn ? "Mute " : "Unmute "} Music</span>
            </Button>

            <div className="flex items-center gap-2 px-2">
              {volume > 0 ? (
                <Volume2 className="size-5 !aspect-square" />
              ) : (
                <VolumeX className="size-5 !aspect-square" />
              )}
              <Slider
                value={[volume]}
                onValueChange={(value) => setVolume(value[0])}
                min={0}
                max={100}
                step={1}
                className="w-full"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const TryIceBreakers = () => {
  return <Fbutton variant="outline">Try Icebreakers</Fbutton>;
};

export const Latency = ({ ms }: { ms: number }) => {
  let Icon = WifiIcon;

  if (ms > 150) Icon = WifiLowIcon;
  else if (ms > 60) Icon = WifiHighIcon;
  else Icon = WifiIcon;

  return (
    <div className="flex items-center gap-2 p-2 px-3 rounded-2xl bg-foreground/5 w-fit text-sm h-12">
      <Icon className="size-5 text-foreground" />
      <span className="whitespace-nowrap">{ms} ms</span>
    </div>
  );
};

export const BeforeWeBegin = () => {
  return (
    <div className="max-w-screen-2xl mx-auto w-full py-4 flex flex-col gap-8 px-4 items-center justify-center h-full">
      <h3 className="text-5xl font-bold text-center">Before We Begin</h3>
      <ul className="text-3xl font-semibold list-decimal list-inside max-w-2xl mx-auto py-24 space-y-4">
        <p>Some instructions...</p>
        <li className="">
          Ensure this screen is being shared on Zoom (or others) or a TV
        </li>
        <li className="">Questions will appear on this screen!</li>
        <li className="">Answer using the device you've joined with!</li>
        <li className="">The faster you answer, the more points you'll get!</li>
      </ul>
      <Fbutton className="max-w-xs mx-auto w-full" variant="secondary">
        Let's Play
      </Fbutton>
      <Fbutton size="sm" variant="outline" className="max-w-xs mx-auto w-full">
        Back to Lobby
      </Fbutton>
    </div>
  );
};

export const HostLobbyFooter = () => {
  const { loading, uiState } = useLobbyHost();
  return (
    <div className="fixed bottom-0 px-4 md:px-8 py-4 w-screen">
      <div className="flex items-center justify-between w-full ">
        <div className="flex-1 flex items-center justify-start gap-4">
          <SettingsBar />
          {/* <Latency ms={34} /> */}
          {!loading && uiState === "LOBBY" && (
            <Fbutton variant="outline" className="w-60">
              Close Lobby
            </Fbutton>
          )}
        </div>
        <div className="flex items-center justify-end gap-4 flex-1">
          <UmatiFullLogo className="w-32 text-foreground hidden md:block" />
          <UmatiLogo className="w-8 text-foreground block md:hidden" />
        </div>
      </div>
    </div>
  );
};

export const LobbyTitle = () => {
  const { lobby } = useLobbyHost();
  return (
    <h1 className="text-6xl text-center font-bold w-4/5">{lobby?.name}</h1>
  );
};

export const JoinLobbyCode = ({
  className,
  vertical,
}: {
  className?: string;
  vertical?: boolean;
}) => {
  const { lobby, joinUrl } = useLobbyHost();
  return (
    <div
      className={cn(
        "bg-foreground/5 w-full  rounded-2xl flex flex-col items-center p-4 h-full group relative",
        className
      )}
    >
      <p className="text-2xl font-bold mb-4 w-full">🔗 Join the party!</p>

      {vertical && (
        <div className="absolute top-4 right-4">
          <Button
            variant="ghost"
            size="icon"
            // onClick={() => setLobbyState("WAITING")}
          >
            {" "}
            <Maximize2Icon />
          </Button>
        </div>
      )}
      <div
        data-vertical={vertical}
        className="flex gap-4 items-center w-full data-[vertical='true']:flex-col my-auto data-[vertical='true']:gap-8 md:mb-8"
      >
        <div className="flex flex-col items-center gap-2 flex-1 w-full">
          <p className="text-lg font-semibold">Scan to join</p>
          <QRCode
            className="size-48 rounded border bg-white p-4 shadow-xs"
            data={joinUrl}
          />
        </div>

        <Separator orientation={vertical ? "horizontal" : "vertical"} />

        <div className="flex flex-col gap-2 flex-1 items-center">
          <p className="text-lg font-semibold">Or Join by Code</p>
          <p className="text-7xl font-bold">{lobby?.code}</p>
        </div>
      </div>
      <CopyLinkButton />
    </div>
  );
};

export const WaitingForPlayers = ({ className }: { className?: string }) => {
  const { players, lobby } = useLobbyHost();

  return (
    <div
      className={cn(
        "bg-foreground/5 w-full aspect-video rounded-2xl h-full p-4 flex flex-col",
        className
      )}
    >
      <p className="font-bold text-2xl text-center mb-4">
        {players.length} / {lobby?.maxPlayers} Players
      </p>

      <div className="relative w-full  h-fit overflow-visible rounded-xl flex flex-wrap gap-3 justify-center">
        {players.map((player, i) => (
          <div key={player.playerId} className="flex flex-col w-fit">
            <Avatar className="size-16 sm:size-16 ring-2 ring-background shadow-md hover:scale-110 transition-transform">
              <AvatarImage src={player.avatar} alt={player.displayName} />
              <AvatarFallback>{player.displayName?.[0]}</AvatarFallback>
            </Avatar>
            <p className="text-center">{player.displayName}</p>
          </div>
        ))}
      </div>
      <p className="m-auto animate-pulse">Waiting for players...</p>
    </div>
  );
};

const gameCardVariants = cva(
  "border border-foreground/20 rounded-3xl p-4 bg-gradient-to-b flex flex-col shadow-xl w-64 h-full  transition-all duration-300 ease-in-out relative overflow-clip cursor-pointer hover:brightness-90 active:brightness-110",
  {
    variants: {
      variant: {
        sky: "from-[var(--umati-sky)] to-[#3A6EE4]",
        aqua: "from-[var(--umati-aqua)] to-[#00D9D5] text-black",
        blue: "from-[var(--umati-blue)] to-[#446BF5]",
        red: "from-[#FE566B] to-[var(--umati-red)] ",
        purple: "from-[#9856FE] to-[var(--umati-purple)] ",
      },
    },
  }
);

export function GameCard({
  className,
  variant,
  title,
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof gameCardVariants> & {
    title?: string;
  }) {
  return (
    <div className={cn(gameCardVariants({ variant, className }))} {...props}>
      <div className="flex flex-col">
        <h2 className="text-lg font-bold ">{title}</h2>
        <p className="text-sm">Multiplayer</p>
      </div>
      <Image
        src="/games/trivia-logo.png"
        alt="Game Image"
        width={80}
        height={80}
        className="ml-auto"
      />

      <div className="bg-black/30 rounded-md flex items-center justify-center p-1 gap-1 absolute bottom-4 left-4">
        <RiMedalFill size={16} className="" />
        <span className="mr-1 font-semibold text-xs">4.7</span>
      </div>
    </div>
  );
}

export const PlayerAvatar = ({
  displayName,
  avatar,
}: {
  displayName: string;
  avatar: string;
}) => {
  return (
    <motion.div className="flex flex-col items-center">
      <Avatar className="size-30 ring-2 ring-foreground shadow-md hover:scale-110 transition-transform mb-2">
        <AvatarImage src={avatar} alt={displayName} />
        <AvatarFallback>{displayName?.[0]}</AvatarFallback>
      </Avatar>
      <p className="text-center text-2xl font-semibold">{displayName}</p>
    </motion.div>
  );
};

export const PlayerJoinLobby = () => {
  const {user} = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [avatar, setAvatar] = useState<string>(user?.avatar ?? getRandomAvatarUrl());
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const { joinLobby } = useLobbyPlayer();

  const handleJoinLobby = async () => {
    setLoading(true);
    try {
      joinLobby(displayName, avatar);
    } catch (error) {
      console.log("🚀 ~ handleJoinLobby ~ error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-screen-2xl mx-auto w-full md:py-8 flex flex-col gap-8 px-5 items-center justify-center md:justify-center h-dvh">
      <UmatiFullLogo className="w-32 text-foreground " />
      <Card className="z-50 rounded-2xl max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-lg md:text-xl text-center">
            Join the Lobby
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <AvatarSelect
              id="avatar"
              value={avatar}
              onChange={setAvatar}
              className="mx-auto"
            />
            <div className="grid gap-2">
              <Label htmlFor="display-name">Display Name</Label>
              <Input
                id="display-name"
                placeholder="Enter Name"
                required
                onChange={(e) => {
                  setDisplayName(e.target.value);
                }}
                value={displayName}
              />
            </div>

            <Fbutton
              type="submit"
              className="w-full"
              disabled={loading}
              onClick={handleJoinLobby}
            >
              Join
            </Fbutton>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export const Reactions = () => {
  const [showTray, setShowTray] = useState(false);
  const trayRef = useRef<HTMLDivElement>(null);
  const emojis = ["❤️", "💔", "😭", "😂", "👍", "👎"];
  const { sendReaction } = useLobbyPlayer();

  useClickOutside(trayRef, () => setShowTray(false));

  const handleSendReaction = (emoji: string) => {
    sendReaction(emoji);
  };

  return (
    <div className="" ref={trayRef}>
      <Fbutton variant="outline" onClick={() => setShowTray(!showTray)}>
        <RiHeart3Line />
      </Fbutton>

      {/* AnimatePresence allows smooth mounting/unmounting */}
      <AnimatePresence>
        {showTray && (
          <motion.div
            key="tray"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 200, damping: 18 }}
            className="bg-foreground/5 select-none rounded-2xl p-4 grid grid-flow-col auto-cols-auto gap-4 items-center absolute bottom-[calc(100%+8px)] w-full inset-x-0 max-w-md mx-auto shadow-lg backdrop-blur-sm"
          >
            {emojis.map((emoji, index) => (
              <motion.button
                key={index}
                whileTap={{ scale: 1.3 }}
                transition={{ type: "spring", stiffness: 300, damping: 10 }}
                className="text-center text-4xl"
                onClick={() => handleSendReaction(emoji)}
              >
                {emoji}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const PlayerReactionLayer = () => {
  const { reactions } = useLobbyHost();
  const [activeReactions, setActiveReactions] = useState<{ id: string; playerId: string; emoji: string; xOffset: number; drift: number; }[]>([]);

  // Whenever reactions change, spawn new emoji reactions
  useEffect(() => {
    const newReactions: { id: string; playerId: string; emoji: string; xOffset: number; drift: number; }[] = [];

    Object.entries(reactions).forEach(([playerId, emoji]) => {
      if (!emoji) return;
      newReactions.push({
        id: `${playerId}-${emoji}-${Date.now()}`,
        playerId,
        emoji,
        xOffset: Math.random() * window.innerWidth - window.innerWidth / 2,
        drift: Math.random() * 80 - 40, // side drift distance
      });
    });

    setActiveReactions((prev) => [...prev, ...newReactions] as any);
  }, [reactions]);

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-50">
      <AnimatePresence>
        {activeReactions.map((r) => (
          <motion.div
            key={r.id}
            initial={{
              opacity: 0,
              y: window.innerHeight, // start fully at the bottom of the viewport
              x: r.xOffset,
              scale: 0.8,
            }}
            animate={{
              opacity: [0, 1, 1, 0], // fade in then fade out at top
              y: -500, // travel off the top smoothly
              x: [r.xOffset, r.xOffset + r.drift, r.xOffset - r.drift / 2],
              scale: [0.8, 1.1, 1],
            }}
            transition={{
              duration: 3.5,
              ease: "easeOut",
            }}
            className="absolute text-6xl select-none"
            style={{
              left: "50%",
              bottom: "0px",
            }}
            onAnimationComplete={() => {
              // remove emoji after animation completes
              setActiveReactions((prev) => prev.filter((x) => x.id !== r.id));
            }}
          >
          {r.emoji}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
