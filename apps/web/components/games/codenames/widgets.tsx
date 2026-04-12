"use client";

import { PlayerAvatar } from "@/components/lobby/widgets";
import { Fbutton } from "@/components/ui/fancy-button";
import { EndGameButton } from "@/components/games/shared";
import { cn } from "@/lib/utils";
import { useLobbyHost } from "@/providers/lobby-host-provider";
import { useLobbyPlayer } from "@/providers/lobby-player-provider";
import { useCodenamesHost } from "@/providers/games/codenames/codenames-host-provider";
import { useCodenamesPlayer } from "@/providers/games/codenames/codenames-player-provider";
import {
  CodenamesCard,
  CodenamesCardColor,
  CodenamesRole,
  CodenamesRound,
  CodenamesSetupState,
  CodenamesTeam,
} from "@umati/ws";

export const CodenamesTitleScreen = () => {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-5 px-4 text-center">
      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-black/50">
        Codenames
      </p>
      <h1 className="text-5xl font-black tracking-tight md:text-7xl">
        Find your team.
      </h1>
      <p className="max-w-xl text-base font-semibold text-black/70 md:text-lg">
        Spymasters guide. Operatives tap. Avoid the assassin.
      </p>
    </div>
  );
};

const teamShell = {
  RED: "border-rose-900/80 bg-rose-500/75",
  BLUE: "border-sky-900/80 bg-sky-500/75",
} as const;

const TEAM_ORDER = [CodenamesTeam.RED, CodenamesTeam.BLUE] as const;

const cardTone = {
  [CodenamesCardColor.RED]: "bg-rose-600 text-white border-rose-700",
  [CodenamesCardColor.BLUE]: "bg-sky-600 text-white border-sky-700",
  [CodenamesCardColor.NEUTRAL]: "bg-stone-300 text-black border-stone-400",
  [CodenamesCardColor.ASSASSIN]: "bg-black text-white border-black",
} as const;

function TeamPanel({
  team,
  setup,
  players,
}: {
  team: CodenamesTeam;
  setup: CodenamesSetupState;
  players: ReturnType<typeof useLobbyHost>["players"];
}) {
  const teamState = setup.teams[team];

  return (
    <div className={cn("rounded-[1.6rem] border p-4", teamShell[team])}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-xl font-black">
          {team === CodenamesTeam.RED ? "Red Team" : "Blue Team"}
        </h3>
        <span className="rounded-full border border-black/10 bg-white/50 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em]">
          {teamState.playerIds.length} players
        </span>
      </div>
      <div className="grid gap-3">
        {teamState.playerIds.map((playerId) => {
          const player = players.find((entry) => entry.id === playerId);
          if (!player) return null;
          const isSpymaster = teamState.spymasterId === player.id;

          return (
            <div
              key={player.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-black/10 bg-white/55 px-3 py-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <PlayerAvatar
                  displayName={player.displayName}
                  avatar={player.avatar ?? ""}
                  className="!size-12 !mb-0"
                  showName={false}
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">
                    {player.displayName}
                  </p>
                  <p className="text-xs text-black/55">
                    {isSpymaster ? "Spymaster" : "Operative"}
                  </p>
                </div>
              </div>
              {isSpymaster ? (
                <span className="rounded-full border border-black/10 bg-black px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-white">
                  Spy
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SetupShell({
  setup,
  players,
  footer,
  teams = TEAM_ORDER,
}: {
  setup: CodenamesSetupState;
  players: ReturnType<typeof useLobbyHost>["players"];
  footer: React.ReactNode;
  teams?: readonly CodenamesTeam[];
}) {
  return (
    <div className="relative z-10 mx-auto flex h-full w-full max-w-6xl flex-col gap-6 px-4 py-6 md:px-8 items-center">
      <div className="rounded-[2rem] border border-black/10 bg-white/55 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.14)] w-full">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-black/45">
              Codenames
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">
              Team Setup
            </h2>
          </div>
          <span
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-bold uppercase tracking-[0.16em]",
              setup.startingTeam === CodenamesTeam.RED
                ? "border-rose-700 bg-rose-600 text-white"
                : "border-sky-700 bg-sky-600 text-white",
            )}
          >
            {setup.startingTeam === CodenamesTeam.RED
              ? "Red starts"
              : "Blue starts"}
          </span>
        </div>
      </div>

      <div
        className={cn(
          "grid flex-1 gap-4 w-full",
          teams.length === 1 ? "grid-cols-1 max-w-2xl" : "lg:grid-cols-2",
        )}
      >
        {teams.map((team) => (
          <TeamPanel key={team} team={team} setup={setup} players={players} />
        ))}
      </div>

      {footer}
    </div>
  );
}

export const CodenamesHostSetup = () => {
  const { setup, startMatch } = useCodenamesHost();
  const { players } = useLobbyHost();

  if (!setup) return null;

  return (
    <div className="relative h-full w-full">
      <SetupShell
        setup={setup}
        players={players}
        footer={
          <div className="relative z-20 flex items-center justify-center">
            <Fbutton
              type="button"
              className="w-full max-w-md"
              disabled={!setup.canStart}
              onClick={startMatch}
            >
              Start Match
            </Fbutton>
          </div>
        }
      />
    </div>
  );
};

export const CodenamesPlayerSetup = () => {
  const { setup, toggleSpymaster } = useCodenamesPlayer();
  const { players, player } = useLobbyPlayer();

  if (!setup || !player) return null;

  const myTeam = setup.myTeam!;
  const teamState = setup.teams[myTeam];
  const isSpymaster = teamState.spymasterId === player.id;
  const spymasterTaken = !!teamState.spymasterId && !isSpymaster;

  return (
    <SetupShell
      setup={setup}
      players={players}
      teams={[myTeam]}
      footer={
        <div className="relative z-20 grid gap-3 rounded-[1.6rem] border border-black/10 bg-white/55 p-4 w-full max-w-2xl mx-auto">
          <div className="rounded-2xl border border-black/10 bg-black/5 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-black/50">
              Your role
            </p>
            <p className="mt-1 text-lg font-black">
              {isSpymaster ? "Spymaster" : "Operative"}
            </p>
          </div>
          <Fbutton
            type="button"
            className="w-full"
            variant={isSpymaster ? "outline" : "default"}
            disabled={spymasterTaken}
            onClick={toggleSpymaster}
          >
            {isSpymaster
              ? "Step Down"
              : spymasterTaken
                ? "Spymaster Taken"
                : "Become Spymaster"}
          </Fbutton>
        </div>
      }
    />
  );
};

function BoardCard({
  card,
  canPick,
  onPick,
}: {
  card: CodenamesCard;
  canPick: boolean;
  onPick?: () => void;
}) {
  const visibleTone = card.color
    ? cardTone[card.color]
    : "bg-white/80 text-black border-black/10";
  const isColorVisible = !!card.color;
  const wordLength = card.word.length;
  const wordClass =
    wordLength >= 8
      ? "text-[10px] leading-tight md:text-xs"
      : wordLength >= 6
        ? "text-xs leading-tight md:text-sm"
        : "text-sm leading-tight md:text-base";

  return (
    <button
      type="button"
      disabled={!canPick || card.revealed}
      onClick={onPick}
      className={cn(
        "flex min-h-24 items-center justify-center rounded-md border px-2 py-3 text-center font-black uppercase tracking-[0.08em] shadow-sm transition md:px-3",
        isColorVisible ? visibleTone : "bg-white/80 text-black border-black/10",
        canPick && !card.revealed && "hover:-translate-y-0.5 hover:shadow-lg",
        !canPick && !card.revealed && "cursor-default",
      )}
    >
      <span
        className={cn("block max-w-full text-balance break-words", wordClass)}
      >
        {card.word}
      </span>
    </button>
  );
}

function MatchShell({
  round,
  boardAction,
  footer,
  showHeader = true,
}: {
  round: CodenamesRound;
  boardAction?: (cardId: string) => void;
  footer?: React.ReactNode;
  showHeader?: boolean;
}) {
  return (
    <div className="mx-auto flex h-full w-full max-w-6xl flex-col gap-5 px-4 py-5 md:px-8">
      {showHeader ? (
        <div className="grid gap-4 rounded-[2rem] border border-black/10 bg-white/60 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.14)] md:grid-cols-[1fr_auto_1fr] md:items-center">
          <div className="rounded-[1.4rem] border border-rose-900/15 bg-rose-500 px-4 py-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-black/45">
              Red Team
            </p>
            <p className="mt-1 text-3xl font-black">
              {round.teams.RED.wordsRemaining}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-black/45">
              Turn
            </p>
            <p className="mt-1 text-2xl font-black">
              {round.activeTeam === CodenamesTeam.RED
                ? "Red Team"
                : "Blue Team"}
            </p>
          </div>
          <div className="rounded-[1.4rem] border border-sky-900/15 bg-sky-500 px-4 py-4 text-right">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-black/45">
              Blue Team
            </p>
            <p className="mt-1 text-3xl font-black">
              {round.teams.BLUE.wordsRemaining}
            </p>
          </div>
        </div>
      ) : null}

      <div className="grid  grid-cols-5 gap-3 max-w-3xl mx-auto w-full">
        {round.board?.map((card) => (
          <BoardCard
            key={card.id}
            card={card}
            canPick={!!boardAction}
            onPick={boardAction ? () => boardAction(card.id) : undefined}
          />
        ))}
      </div>
      {footer}
    </div>
  );
}

export const CodenamesHostRound = () => {
  const { round } = useCodenamesHost();
  if (!round) return null;

  return <MatchShell round={round} />;
};

export const CodenamesPlayerRound = () => {
  const { round, pickCard, passTurn } = useCodenamesPlayer();
  if (!round) return null;

  const canPick =
    round.myRole === CodenamesRole.OPERATIVE &&
    round.myTeam === round.activeTeam &&
    !round.winnerTeam;

  return (
    <MatchShell
      round={round}
      boardAction={canPick ? pickCard : undefined}
      showHeader={false}
      footer={
        canPick ? (
          <Fbutton
            type="button"
            className="w-full"
            onClick={() => passTurn(round.activeTeam)}
          >
            End Turn
          </Fbutton>
        ) : null
      }
    />
  );
};

export const CodenamesHostResult = () => {
  const { round, nextRound } = useCodenamesHost();
  const { players } = useLobbyHost();
  if (!round?.winnerTeam) return null;

  const winnerTeam = round.winnerTeam;
  const winningTeamColor = winnerTeam === CodenamesTeam.RED ? "Red" : "Blue";
  const winningTeamPlayers = players.filter((p) =>
    round.teams[winnerTeam].playerIds.includes(p.id),
  );

  return (
    <div className="relative h-full w-full">
      <div className="absolute right-4 top-4 z-50">
        <EndGameButton />
      </div>
      <div className="flex h-full flex-col items-center justify-center gap-8 px-4 text-center">
        <div className="animate-in fade-in zoom-in duration-700">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-black/50 mb-3">
            Match Over
          </p>
          <h2 className="text-6xl md:text-7xl font-black tracking-tight mb-2">
            Team {winningTeamColor}
          </h2>
          <p className="text-lg md:text-2xl font-bold text-black/70">Wins!</p>
        </div>

        {/* Winning Team Avatars */}
        <div className="flex flex-wrap gap-4 justify-center max-w-2xl">
          {winningTeamPlayers.map((player, index) => (
            <div
              key={player.id}
              className="animate-in zoom-in slide-in-from-bottom-4 duration-700"
              style={{
                animationDelay: `${(index + 1) * 100}ms`,
                animationFillMode: "backwards",
              }}
            >
              <div className="flex flex-col items-center gap-2">
                <div className="ring-4 ring-yellow-300 rounded-full shadow-lg hover:scale-110 transition-transform">
                  <PlayerAvatar
                    displayName={player.displayName}
                    avatar={player.avatar ?? ""}
                    className="!size-20 !mb-0"
                    showName={false}
                  />
                </div>
                <p className="text-sm font-bold text-black/70">
                  {player.displayName}
                </p>
              </div>
            </div>
          ))}
        </div>

        <Fbutton
          type="button"
          className="w-full max-w-xs mt-4"
          onClick={nextRound}
        >
          Back to Lobby
        </Fbutton>
      </div>
    </div>
  );
};

export const CodenamesPlayerResult = () => {
  const { round } = useCodenamesPlayer();
  const { players } = useLobbyPlayer();
  if (!round?.winnerTeam) return null;

  const winnerTeam = round.winnerTeam;
  const winningTeamColor = winnerTeam === CodenamesTeam.RED ? "Red" : "Blue";
  const winningTeamPlayers = players.filter((p) =>
    round.teams[winnerTeam].playerIds.includes(p.id),
  );

  return (
    <div className="flex h-full flex-col items-center justify-center gap-8 px-4 text-center">
      <div className="animate-in fade-in zoom-in duration-700">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-black/50 mb-3">
          Match Over
        </p>
        <h2 className="text-6xl md:text-7xl font-black tracking-tight mb-2">
          Team {winningTeamColor}
        </h2>
        <p className="text-lg md:text-2xl font-bold text-black/70">Wins!</p>
      </div>

      {/* Winning Team Avatars */}
      <div className="flex flex-wrap gap-4 justify-center max-w-2xl">
        {winningTeamPlayers.map((player, index) => (
          <div
            key={player.id}
            className="animate-in zoom-in slide-in-from-bottom-4 duration-700"
            style={{
              animationDelay: `${(index + 1) * 100}ms`,
              animationFillMode: "backwards",
            }}
          >
            <div className="flex flex-col items-center gap-2">
              <div className="ring-4 ring-yellow-300 rounded-full shadow-lg hover:scale-110 transition-transform">
                <PlayerAvatar
                  displayName={player.displayName}
                  avatar={player.avatar ?? ""}
                  className="!size-20 !mb-0"
                  showName={false}
                />
              </div>
              <p className="text-sm font-bold text-black/70">
                {player.displayName}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
