"use client";

import { useAuth } from "@/providers/auth-provider";
import { RiGroup3Fill, RiHeart3Line } from "@remixicon/react";
import { Games, Player, RoomState } from "@umati/ws";
import { cva, VariantProps } from "class-variance-authority";
import {
  MaximizeIcon,
  MinimizeIcon,
  UserRoundX,
  WifiHighIcon,
  WifiIcon,
  WifiLowIcon,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import useClickOutside from "../../hooks/use-click-outside";
import { useClipboard } from "../../hooks/use-clipboard";
import { cn, getRandomAvatarUrl } from "../../lib/utils";
import { useLobbyHost } from "../../providers/lobby-host-provider";
import { useLobbyPlayer } from "../../providers/lobby-player-provider";
import { useAlert } from "../../providers/modal-provider";
import { useSettings } from "../../providers/settings-provider";
import {
  Avatar,
  AvatarFallback,
  AvatarGroupCount,
  AvatarImage,
} from "../ui/avatar";
import AvatarSelect from "../ui/avatar-select";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Fbutton } from "../ui/fancy-button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import UmatiLogo, { UmatiFullLogo } from "../ui/logo";
import { Separator } from "../ui/separator";
import { QRCode } from "../ui/shadcn-io/qr-code";
import GameCarousel from "./game-carousel";

export const CopyLinkButton = () => {
  const { joinUrl } = useLobbyHost();
  const { copied, copy } = useClipboard(2500);
  return (
    <motion.div whileTap={{ scale: 0.95 }} transition={{ duration: 0.15 }}>
      <Fbutton
        type="button"
        variant="outline"
        size="sm"
        className="w-full max-w-2xs"
        onClick={() => {
          copy(joinUrl);
        }}
      >
        <motion.span
          key={copied ? "copied" : "copy"}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.2 }}
        >
          {copied ? "Copied" : "Copy Link"}
        </motion.span>
      </Fbutton>
    </motion.div>
  );
};

export const SettingsBar = () => {
  const { fullscreen, toggleFullscreen } = useSettings();

  return (
    <div className="flex items-center gap-2 p-2 rounded-2xl bg-foreground/5 w-fit relative h-12">
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
    </div>
  );
};

export const TryIceBreakers = () => {
  return <Fbutton variant="outline">Try Icebreakers</Fbutton>;
};

export const LobbySection = ({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "bg-foreground/5 w-full rounded-2xl p-4 flex flex-col",
        className,
      )}
    >
      <p className="text-2xl font-bold mb-4">{title}</p>
      {children}
    </div>
  );
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

export const BeforeWeBegin = ({dark}: {dark?: boolean}) => {
  const { startGame, cancelGame, game } = useLobbyHost();

  const instructions = useMemo(
    () => Games.find((g) => g.id === game?.type)?.instructions,
    [game],
  );

  return (
    <div
      className={
        "max-w-screen-2xl mx-auto w-full py-4 flex flex-col gap-8 px-4 items-center justify-center h-full"
      }
    >
      <h3 className="text-5xl font-bold text-center">How to Play</h3>
      <div
        className="rules"
        dangerouslySetInnerHTML={{ __html: instructions! }}
      ></div>
      <Fbutton
        className="max-w-xs mx-auto w-full"
        variant={dark ? "dark" : "secondary"}
        onClick={startGame}
      >
        Let's Play
      </Fbutton>
      <Fbutton
        size="sm"
        variant={dark ? "dark-outline" : "outline"}
        className="max-w-xs mx-auto w-full"
        onClick={cancelGame}
      >
        Back to Lobby
      </Fbutton>
    </div>
  );
};

export const HostLobbyFooter = () => {
  const { closeLobby } = useLobbyHost();
  return (
    <div className="fixed bottom-0 px-4 md:px-8 py-4 w-screen">
      <div className="flex items-center justify-between w-full gap-3">
        <div className="flex-1 flex items-center justify-start gap-3 md:gap-4 min-w-0">
          <SettingsBar />
          <Fbutton
            size="sm"
            variant="outline"
            className="max-w-xs mx-auto w-full"
            onClick={closeLobby}
          >
            Close Lobby
          </Fbutton>
        </div>
        <div className="flex items-center justify-end gap-2 md:gap-4">
          <UmatiFullLogo className="w-24 text-foreground hidden md:block" />
          <UmatiLogo className="w-8 text-foreground block md:hidden" />
        </div>
      </div>
    </div>
  );
};

export const LobbyTitle = () => {
  const { lobby, joinUrl } = useLobbyHost();
  return (
    <section className="relative isolate w-full overflow-hidden rounded-[2rem] border border-white/12 bg-[linear-gradient(135deg,rgba(255,255,255,0.09),rgba(255,255,255,0.03))] px-5 py-5 md:px-6 md:py-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,202,40,0.18),transparent_24%),radial-gradient(circle_at_top_right,rgba(77,199,255,0.16),transparent_28%),radial-gradient(circle_at_bottom,rgba(239,62,70,0.14),transparent_34%)]" />
      <div className="absolute -left-12 top-0 h-36 w-36 rounded-full bg-[var(--umati-yellow)]/12 blur-3xl" />
      <div className="absolute right-0 top-0 h-40 w-40 translate-x-1/4 -translate-y-1/4 rounded-full bg-[var(--umati-sky)]/12 blur-3xl" />

      <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-3xl">
          <div className="mb-3 inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-black/20 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-white/75">
            <span className="inline-block size-2 rounded-full bg-[var(--umati-yellow)] shadow-[0_0_18px_var(--umati-yellow)]" />
            Live Lobby
          </div>
          <h1 className="max-w-4xl text-4xl font-black tracking-tight text-white md:text-6xl">
            {lobby?.name}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70 md:text-[15px]">
            Your party room is live. Share the code, fill the room, and kick off
            the next crowd favorite.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
          <div className="rounded-[1.5rem] border border-white/12 bg-black/20 px-4 py-4 backdrop-blur-md">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/60">
              Join by code
            </p>
            <p className="mt-2 text-4xl font-black tracking-[0.08em] text-white md:text-5xl">
              {lobby?.code}
            </p>
            <p className="mt-2 text-sm font-semibold text-white/65">
              Fastest way into the room
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-[1.5rem] border border-white/12 bg-white/8 px-4 py-4 backdrop-blur-md">
            <div className="rounded-[1.25rem] border border-white/12 bg-white p-2 shadow-sm">
              <QRCode
                className="size-22 rounded-lg bg-white p-1"
                data={joinUrl}
              />
            </div>
            <div className="max-w-36">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/60">
                Scan to join
              </p>
              <p className="mt-2 text-sm font-semibold text-white">
                Let guests hop in with their phone camera.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export const JoinLobbyCode = ({
  className,
  vertical,
}: {
  className?: string;
  vertical?: boolean;
}) => {
  const { lobby, joinUrl, changeUiState } = useLobbyHost();
  return (
    <div
      className={cn(
        "bg-foreground/5 w-full  rounded-2xl flex flex-col items-center p-4 h-full group relative",
        className,
      )}
    >
      <p className="text-2xl font-bold mb-4 w-full">🔗 Join the party!</p>

      <div className="flex flex-col gap-4 items-center w-full mb-8">
        <div className="flex flex-col items-center gap-2 flex-1 w-full">
          <p className="text-sm font-semibold">Scan to join</p>
          <QRCode
            className="size-36 md:size-48 rounded border bg-white p-4 shadow-xs"
            data={joinUrl}
          />
        </div>

        <Separator orientation="horizontal" />

        <div className="flex flex-col gap-2 flex-1 items-center">
          <p className="text-lg font-semibold">Or Join by Code</p>
          <p className="text-5xl md:text-6xl font-bold">{lobby?.code}</p>
        </div>
      </div>
      <CopyLinkButton />
    </div>
  );
};

export const WaitingForPlayers = ({ className }: { className?: string }) => {
  const { players, lobby, uiState, kickPlayer } = useLobbyHost();
  const { showAlert } = useAlert();
  const [contextMenu, setContextMenu] = useState<{
    player: Player;
    x: number;
    y: number;
  } | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  useClickOutside(contextMenuRef, () => setContextMenu(null));

  const lobbyReady = players.length === lobby?.maxPlayers;
  const waitingForMorePlayers = players.length < (lobby?.maxPlayers ?? 0) / 2;

  return (
    <>
      <motion.div
        className={cn(
          "relative isolate flex h-full w-full flex-1 flex-col overflow-hidden rounded-[1.75rem] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.24)]",
          className,
        )}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(77,199,255,0.14),transparent_26%),radial-gradient(circle_at_top_right,rgba(255,202,40,0.14),transparent_28%),radial-gradient(circle_at_bottom,rgba(106,59,255,0.14),transparent_34%)]" />

        <motion.div
          className="relative z-10 mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <div className="space-y-2">
            <div>
              <h3 className="text-lg font-black tracking-tight text-white md:text-xl">
                Players Ready
              </h3>
              <p className="text-sm leading-6 text-white/70 md:text-[15px]">
                Round up the crew, watch the room fill, and keep the energy
                high.
              </p>
            </div>
          </div>

          <motion.div
            className="flex items-center gap-3 self-start rounded-[1.25rem] border border-white/12 bg-white/6 px-3 py-2 md:self-auto"
            animate={
              lobbyReady ? { boxShadow: "0 0 20px rgba(255,202,40,0.3)" } : {}
            }
            transition={{
              duration: 0.6,
              repeat: lobbyReady ? Infinity : 0,
              repeatType: "reverse",
            }}
          >
            <div className="leading-tight">
              <motion.p
                className="text-lg font-black text-white flex-1 whitespace-nowrap"
                key={players.length}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
              >
                {players.length} / {lobby?.maxPlayers}
              </motion.p>
            </div>
          </motion.div>
        </motion.div>

        <div className="relative z-10 flex-1 overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/15 p-4">
          <div className="relative flex h-full w-full flex-wrap content-start justify-center gap-3 overflow-y-auto rounded-xl scrollbar-hide">
            <AnimatePresence mode="popLayout">
              {players.slice(0, 24).map((player, idx) => (
                <motion.div
                  key={player.id}
                  className="flex flex-col w-fit items-center"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{
                    duration: 0.3,
                    delay: Math.min(idx * 0.08, 0.6),
                    ease: [0.25, 1, 0.5, 1],
                  }}
                >
                  <motion.button
                    type="button"
                    className="rounded-full outline-hidden"
                    aria-label={`${player.displayName} actions`}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
                    onContextMenu={(event) => {
                      event.preventDefault();
                      setContextMenu({
                        player,
                        x: event.clientX,
                        y: event.clientY,
                      });
                    }}
                  >
                    <Avatar
                      className={cn("ring-2 ring-background shadow-md", {
                        "size-16": uiState === RoomState.INIT,
                        "size-12": uiState === RoomState.LOBBY,
                      })}
                    >
                      <AvatarImage
                        src={player.avatar}
                        alt={player.displayName}
                      />
                      <AvatarFallback>{player.displayName?.[0]}</AvatarFallback>
                    </Avatar>
                  </motion.button>
                  <motion.p
                    className={cn("text-center font-semibold", {
                      "mt-1 text-sm": uiState === RoomState.INIT,
                      "mt-0.5 text-xs": uiState === RoomState.LOBBY,
                    })}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{
                      delay: Math.min(idx * 0.08 + 0.15, 0.75),
                      duration: 0.2,
                    }}
                  >
                    {player.displayName}
                  </motion.p>
                </motion.div>
              ))}
            </AnimatePresence>
            {players.length > 24 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  duration: 0.3,
                  delay: Math.min(24 * 0.08, 0.6),
                  ease: [0.25, 1, 0.5, 1],
                }}
              >
                <AvatarGroupCount
                  className={cn("ring-2 ring-background shadow-md", {
                    "size-16": uiState === RoomState.INIT,
                    "size-12": uiState === RoomState.LOBBY,
                  })}
                >
                  +{Math.max(players.length - 24, 0)}
                </AvatarGroupCount>
              </motion.div>
            )}
          </div>
        </div>
        {waitingForMorePlayers && (
          <motion.p
            className="relative z-10 mt-4 text-center font-semibold text-white/75"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            Waiting for players to roll in...
          </motion.p>
        )}
        {lobbyReady && uiState === RoomState.INIT && (
          <motion.p
            className="relative z-10 mt-4 text-center font-semibold text-white"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
          >
            Everyone is here. Let the chaos begin.
          </motion.p>
        )}
      </motion.div>
      {contextMenu && (
        <div
          ref={contextMenuRef}
          className="fixed z-50 min-w-40 rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive transition hover:bg-destructive/10"
            onClick={() => {
              const playerToKick = contextMenu.player;
              setContextMenu(null);

              showAlert({
                title: "Kick player?",
                description: playerToKick
                  ? `${playerToKick.displayName} will be removed from the lobby immediately.`
                  : "This player will be removed from the lobby immediately.",
                confirmText: "Kick player",
                closeText: "Cancel",
                onConfirm: () => {
                  kickPlayer(
                    playerToKick.id,
                    "The host removed you from the lobby.",
                  );
                },
              });
            }}
          >
            <UserRoundX className="size-4" />
            Kick player
          </button>
        </div>
      )}
    </>
  );
};

const gameCardVariants = cva(
  "group border border-white/20 rounded-[2rem] p-5 bg-gradient-to-b flex flex-col shadow-xl size-48 transition-all duration-300 ease-out relative overflow-hidden cursor-pointer text-white hover:-translate-y-1 hover:shadow-2xl active:scale-[0.99]",
  {
    variants: {
      variant: {
        sky: "from-[var(--umati-sky)] to-[#3A6EE4]",
        aqua: "from-[var(--umati-aqua)] to-[#00D9D5] text-black",
        blue: "from-[var(--umati-blue)] to-[#446BF5]",
        red: "from-[#FE566B] to-[var(--umati-red)] ",
        purple: "from-[#9856FE] to-[var(--umati-purple)] ",
        lime: "from-lime-500 to-green-600",
        orange: "from-orange-400 to-orange-600",
        yellow: "from-yellow-400 to-yellow-600 text-black",
      },
    },
  },
);

export function GameCard({
  className,
  variant,
  game,
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof gameCardVariants> & {
    game: (typeof Games)[0];
  }) {
  const usesDarkText = variant === "aqua" || variant === "yellow";

  return (
    <motion.div
      className={cn(gameCardVariants({ variant, className }))}
      whileHover={{ y: -4, boxShadow: "0 24px 48px rgba(0,0,0,0.32)" }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
      {...props}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.3),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(0,0,0,0.18),transparent_30%)]" />
      <motion.div
        className="absolute inset-x-5 top-4 flex items-center justify-between gap-3 z-10"
        initial={{ opacity: 0.8 }}
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        <span
          className={cn(
            "rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] backdrop-blur-sm",
            usesDarkText
              ? "border border-black/15 bg-black/10 text-black"
              : "border border-white/25 bg-white/15 text-white",
          )}
        >
          {game.playable ? "Ready to play" : "Coming soon"}
        </span>
      </motion.div>

      <div className="relative z-10 mt-11 flex h-full flex-col">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="max-w-[11rem]">
            <h2 className="text-2xl font-black leading-tight tracking-tight">
              {game.title}
            </h2>
            <p
              className={cn(
                "mt-2 text-sm leading-5",
                usesDarkText ? "text-black/75" : "text-white/80",
              )}
            >
              {game?.description ??
                "Fast-paced party game built for shared screens and loud rooms."}
            </p>
          </div>

          {game?.src && (
            <motion.div
              className="relative shrink-0"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <motion.div
                className="absolute inset-0 scale-110 rounded-full bg-white/25 blur-2xl"
                initial={{ opacity: 0.6 }}
                whileHover={{ opacity: 0.9 }}
                transition={{ duration: 0.3 }}
              />
              <div className="relative flex size-22 items-center justify-center rounded-[1.75rem] border border-white/20 bg-white/12 backdrop-blur-md shadow-lg">
                <Image
                  src={game.src}
                  alt={game.title}
                  width={96}
                  height={96}
                  className="size-16 object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.28)]"
                />
              </div>
            </motion.div>
          )}
        </div>

        <div className="mt-auto flex items-end justify-between gap-3">
          <div
            className={cn(
              "rounded-2xl px-3 py-2 backdrop-blur-sm",
              usesDarkText
                ? "border border-black/15 bg-black/10 text-black"
                : "border border-white/15 bg-black/20 text-white",
            )}
          >
            <div className="flex items-center gap-2 text-sm font-semibold">
              <RiGroup3Fill size={16} />
              <span>{game?.min}+ players</span>
            </div>
          </div>

          {game.playable && (
            <motion.div
              className="text-right"
              initial={{ opacity: 0.7 }}
              whileHover={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              <p
                className={cn(
                  "text-sm font-semibold",
                  usesDarkText ? "text-black/85" : "text-white/90",
                )}
              >
                Tap to configure
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export const PlayerAvatar = ({
  displayName,
  avatar,
  className
}: {
  displayName: string;
  avatar: string;
  className?: string;
}) => {
  return (
    <motion.div className="flex flex-col items-center">
      <Avatar
        className={cn(
          "size-30 ring-2 ring-foreground shadow-md hover:scale-110 transition-transform mb-2 relative", className
        )}
      >
        <AvatarImage src={avatar} alt={displayName} />
        <AvatarFallback>{displayName?.[0]}</AvatarFallback>
      </Avatar>
      <p className="text-center text-2xl font-semibold">{displayName}</p>
    </motion.div>
  );
};

export const PlayerJoinLobby = () => {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [avatar, setAvatar] = useState<string>(
    user?.avatar ?? getRandomAvatarUrl()
  );
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

  const MAX_DISPLAY_NAME_LENGTH = 15;

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
                maxLength={MAX_DISPLAY_NAME_LENGTH}
                onChange={(e) => {
                  setDisplayName(e.target.value);
                }}
                value={displayName}
              />
              <div className="flex items-center justify-end">
                <span className="text-xs opacity-55">{displayName.length}/{MAX_DISPLAY_NAME_LENGTH}</span>
              </div>
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

      <Link href="/" className="text-center text-white font-medium hover:underline">Back to Homepage</Link>
    </div>
  );
};

export const PlayerLeaveButton = () => {
  const { leaveLobby } = useLobbyPlayer();
  return (
    <Fbutton
      variant="secondary"
      className="w-full flex-1 mt-auto"
      onClick={leaveLobby}
    >
      Leave Room
    </Fbutton>
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
  const [activeReactions, setActiveReactions] = useState<
    {
      id: string;
      playerId: string;
      emoji: string;
      xOffset: number;
      drift: number;
    }[]
  >([]);

  // Whenever reactions change, spawn new emoji reactions
  useEffect(() => {
    const newReactions: {
      id: string;
      playerId: string;
      emoji: string;
      xOffset: number;
      drift: number;
    }[] = [];

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


export const PlayerJoinAnimationLayer = () => {
    const { players, uiState } = useLobbyHost();
  const [activeReactions, setActiveReactions] = useState<
    {
      id: string;
      player: Player;
      xOffset: number;
      drift: number;
    }[]
  >([]);

  const prevPlayersRef = useRef<Player[]>([]);

  useEffect(() => {
    const prevPlayers = prevPlayersRef.current;
    const newJoins: Player[] = [];

    players.forEach((p) => {
      const prev = prevPlayers.find((pp) => pp.id === p.id);

      if ((!prev && p.connected) || (prev && !prev.connected && p.connected)) {
        newJoins.push(p);
      }
    });

    prevPlayersRef.current = players;

    if (newJoins.length === 0) return;

    const reactions = newJoins.map((player) => ({
      id: `join-${player.id}-${Date.now()}`,
      player,
      xOffset: Math.random() * window.innerWidth - window.innerWidth / 2,
      drift: Math.random() * 80 - 40,
    }));

    setActiveReactions((prev) => [...prev, ...reactions]);
  }, [players]);

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-50">
      <AnimatePresence>
        {activeReactions.map((r) => (
          <motion.div
            key={r.id}
            initial={{
              opacity: 0,
              y: window.innerHeight,
              x: r.xOffset,
              scale: 0.8,
            }}
            animate={{
              opacity: [0, 1, 1, 0],
              y: -500,
              x: [r.xOffset, r.xOffset + r.drift, r.xOffset - r.drift / 2],
              scale: [0.8, 1.1, 1],
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 3.5,
              ease: "easeOut",
            }}
            className="absolute select-none flex flex-col items-center justify-center"
            style={{
              left: "50%",
              bottom: "0px",
            }}
            onAnimationComplete={() => {
              setActiveReactions((prev) =>
                prev.filter((x) => x.id !== r.id)
              );
            }}
          >
            {/* Replace emoji with avatar */}
            <Avatar
              className={cn(
                "ring-2 ring-background shadow-md transition-transform",
                {
                  "size-16": uiState === RoomState.INIT,
                  "size-12": uiState === RoomState.LOBBY,
                }
              )}
            >
              <AvatarImage
                src={r.player.avatar}
                alt={r.player.displayName}
              />
              <AvatarFallback>
                {r.player.displayName?.[0]}
              </AvatarFallback>
            </Avatar>
            <p className="text-sm font-semibold text-center">{r.player.displayName} Joined!</p>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export const Reconnecting = () => {
  const { reconnecting } = useLobbyPlayer();

  return (
    <AnimatePresence>
      {reconnecting && (
        <div className="w-full h-full absolute z-10 bg-black/40 inset-0 flex flex-col items-center justify-center">
          <p className="font-semibold text-xl">Reconnecting...</p>
        </div>
      )}
    </AnimatePresence>
  );
};

export const DesktopOnly = () => {
  return (
    <div className="flex flex-col items-center justify-center h-dvh bg-black text-white text-center p-6">
      <UmatiLogo className="w-8 text-foreground block md:hidden" />
      <div className="my-auto">
        <h1 className="text-3xl font-bold mb-4">Desktop Only</h1>
        <p className="text-lg max-w-md mb-6 w-full mx-auto">
          Hosting is only supported on desktop devices. Please use a laptop or
          desktop computer to access the host dashboard.
        </p>
        <Link href="/">
          <Fbutton className="w-full max-w-xs">Go Back</Fbutton>
        </Link>
      </div>
    </div>
  );
};


export const GameShelf = ({ className }: { className?: string }) => {
  return (
    <section
      className={cn(
        "relative isolate h-full w-full overflow-clip overflow-x-visible rounded-[2rem] border border-white/12 bg-[linear-gradient(135deg,rgba(255,255,255,0.09),rgba(255,255,255,0.03))] p-4 md:p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl",
        className,
      )}
    >
      <div className="h-full w-full absolute inset-0 overflow-clip rounded-[2rem] ">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,202,40,0.16),transparent_28%),radial-gradient(circle_at_top_right,rgba(77,199,255,0.16),transparent_32%),radial-gradient(circle_at_bottom,rgba(106,59,255,0.16),transparent_34%)]" />
        <div className="absolute -left-10 top-8 h-28 w-28 rounded-full bg-[var(--umati-yellow)]/12 blur-3xl" />
        <div className="absolute right-0 top-0 h-36 w-36 translate-x-1/4 -translate-y-1/4 rounded-full bg-[var(--umati-sky)]/12 blur-3xl" />
      </div>
      <div className="relative z-10 flex flex-col gap-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <div className="space-y-1">
              <h2 className="text-2xl font-black tracking-tight text-white md:text-3xl">
                Game Shelf
              </h2>
              <p className="max-w-2xl text-sm leading-6 text-white/70 md:text-[15px]">
                Queue up the next crowd-pleaser and keep the room moving.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start rounded-2xl border border-white/12 bg-white/6 px-3 py-2 text-xs font-semibold text-white/75 md:self-auto">
            <span className="inline-flex size-8 items-center justify-center rounded-xl bg-white/10 text-base">
              🎉
            </span>
            <span>Pick a game to start the party</span>
          </div>
        </div>

        <GameCarousel />
      </div>
    </section>
  );
};
