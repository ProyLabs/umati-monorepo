import { BaseGame } from "./base";
import {
  ChameleonCategories,
  ChameleonCategory,
  ChameleonRound,
  ChameleonRoundRole,
  GameState,
  GameType,
  RoomState,
  WSEvent,
} from "@umati/ws";
import { RoomManager } from "../room-manager";
import { chameleonCategories } from "./chameleon-categories";
import type { WebSocket } from "ws";

type ChameleonVote = {
  vote: string;
  timeTaken: number;
};

export class Chameleon extends BaseGame {
  static maxRounds = 10;
  static basePoints = 100;
  static timeBonusFactor = 0.5;
  static skipVote = "__skip__";

  public noOfRounds: number;
  public noOfChameleons: number;

  private categories = chameleonCategories;
  private roles: Map<string, ChameleonRoundRole> = new Map();
  private votes: Map<string, ChameleonVote> = new Map();
  private counts: Record<string, number> = {};
  private chameleons: string[] = [];
  private currentCategory?: ChameleonCategory;
  private secretWord = { word: "", position: "" };
  private speakingOrder?: ChameleonRound['speakingOrder'];
  private roundSpeakingDuration: number = 0;
  private roundVotingDuration: number = 0;

  private get voteProgress() {
    return {
      votedCount: this.votes.size,
      totalVoters: this.scores.length,
    };
  }

  private buildRound(overrides?: Partial<ChameleonRound>): ChameleonRound {
    return {
      number: this.currentRound + 1,
      totalRounds: this.noOfRounds,
      category: this.currentCategory!,
      roll: this.secretWord.position,
      roles: Object.fromEntries(this.roles),
      speakingOrder: this.speakingOrder,
      timer: {
        duration: this.roundDuration / 1000,
        startedAt: this.roundStartTime,
      },
      votes: Object.fromEntries(
        Array.from(this.votes.entries()).map(([playerId, value]) => [playerId, value.vote])
      ),
      counts: this.counts,
      ...this.voteProgress,
      ...overrides,
    };
  }

  get round(): ChameleonRound {
    return this.buildRound();
  }

  constructor(
    roomId: string,
    options: {
      noOfRounds: number;
      chameleons?: number;
      speakingDuration?: number;
      votingDuration?: number;
    }
  ) {
    super(roomId, GameType.CHAMELEON);
    this.noOfRounds = Math.min(options.noOfRounds, Chameleon.maxRounds);
    this.noOfChameleons = options.chameleons ?? 1;
    this.roundSpeakingDuration = (options.speakingDuration ?? 90) * 1000;
    this.roundVotingDuration = (options.votingDuration ?? 30) * 1000;
    this.init();
  }

  private init() {
    this.initPlayerScores();
  }

  private initPlayerScores() {
    const room = RoomManager.get(this.roomId);
    if (!room) return;
    room.players.forEach((p) => {
      this.gameScore.set(p.id, {
        id: p.id,
        displayName: p.displayName,
        score: 0,
      });
    });
  }

  public startGame(): void {
    this.setRoomState(RoomState.PLAYING);
    this.state = GameState.ROUND_SETUP;
    this.startRound();
  }

  private clearPhaseTimer() {
    if (!this.roundTimer) return;
    clearTimeout(this.roundTimer);
    this.roundTimer = undefined;
  }

  private schedulePhaseTransition(delay: number, next: () => void) {
    this.clearPhaseTimer();
    this.roundTimer = setTimeout(next, delay);
  }

  private buildHostState() {
    return {
      id: this.id,
      type: this.type,
      state: this.state,
      round: this.buildRound({
        roles: Object.fromEntries(this.roles),
      }),
      scores: this.scores,
    };
  }

  private buildPlayerState(playerId: string) {
    const myRole = this.roles.get(playerId);
    return {
      id: this.id,
      type: this.type,
      state: this.state,
      round: this.buildRound({
        roles: myRole ? { [playerId]: myRole } : {},
        myRole,
        votes: {},
      }),
      scores: this.scores,
    };
  }

  public sendStateToSocket(ws: WebSocket, options?: { playerId?: string; isHost?: boolean }) {
    const payload =
      options?.isHost || !options?.playerId
        ? this.buildHostState()
        : this.buildPlayerState(options.playerId);

    ws.send(JSON.stringify({ event: WSEvent.GAME_STATE, payload }));
  }

  private emitState() {
    const room = RoomManager.get(this.roomId);
    if (!room) return;

    RoomManager.toHost(this.roomId, WSEvent.GAME_STATE, this.buildHostState());
    for (const player of room.players) {
      RoomManager.toPlayer(
        this.roomId,
        player.id,
        WSEvent.GAME_STATE,
        this.buildPlayerState(player.id)
      );
    }
  }

  private emitVoteProgress() {
    this.broadcast(WSEvent.CH_VOTE_PROGRESS, this.voteProgress);
  }

  private startRound() {
    this.state = GameState.ROUND_SETUP;
    this.votes.clear();
    this.roles.clear();

    const room = RoomManager.get(this.roomId);
    if (!room) return;

    // 🎭 Pick Chameleons
    this.chameleons = this.randomize.sample(
      room.players.map((p) => p.id),
      this.noOfChameleons
    );

    // 🎲 Pick random category
    const category = this.randomize.pick(this.categories);
    const shuffled = this.randomize.shuffle(category?.words!);

    const letters = ["A", "B", "C", "D"];
    const numbers = ["1", "2", "3", "4"];

    const letter = this.randomize.pick(letters);
    const number = this.randomize.pick(numbers);

    this.secretWord = {
      word: selectItem(shuffled, `${letter}${number}`),
      position: `${letter}${number}`,
    };

    this.currentCategory = {
      title: category?.title!,
      words: category?.words!,
    };

    console.log("🚀 ~ Chameleon ~ startRound ~ room.players:", room.players);
    for (const player of room.players) {
      const role: ChameleonRoundRole = this.chameleons.includes(player.id)
        ? ChameleonRoundRole.CHAMELEON
        : ChameleonRoundRole.CIVILIAN;
      this.roles.set(player.id, role);
    }
    console.log("🚀 ~ Chameleon ~ startRound ~ this.roles:", this.roles);

    console.log("🚀 ~ Chameleon ~ startRound ~ this.round:", this.round);

    this.toHost(WSEvent.CH_ROUND_START, {
      state: this.state,
      round: this.buildRound({
        roles: Object.fromEntries(this.roles),
      }),
    });
    for (const player of room.players) {
      this.toPlayer(player.id, WSEvent.CH_ROUND_START, {
        state: this.state,
        round: this.buildRound({
          roles: this.roles.get(player.id) ? { [player.id]: this.roles.get(player.id)! } : {},
          myRole: this.roles.get(player.id),
          votes: {},
        }),
      });
    }
  }

  public startSpeaking() {
    if (this.state !== GameState.ROUND_SETUP) return;
    this.state = GameState.SPEAKING;

    const room = RoomManager.get(this.roomId);
    if (!room) return;

    // Pick random starting player
    const starterId = this.randomize.pick(room.players.map((p) => p.id));
    const starter = room.players.find((p) => p.id === starterId);

    // Choose direction
    const direction = this.randomize.boolean() ? "CLOCKWISE" : "ANTICLOCKWISE";
    this.speakingOrder = {
      starter: starter!,
      direction,
    };

    const SPEAKING_TIME_PER_PLAYER = 15 * 1000 * 2; // 15 seconds per player per 2 rounds

    this.roundSpeakingDuration = (SPEAKING_TIME_PER_PLAYER * room.players.length) || 15000;

    this.roundStartTime = Date.now();
    this.roundDuration = this.roundSpeakingDuration;
    this.schedulePhaseTransition(this.roundDuration, () => {
      this.startVoting();
    });

    this.emitState();
  }

  public startVoting() {
    if (this.state !== GameState.SPEAKING) return;
    this.state = GameState.VOTING;

    const room = RoomManager.get(this.roomId);
    if (!room) return;

    this.roundStartTime = Date.now();
    this.roundDuration = this.roundVotingDuration;
    this.schedulePhaseTransition(this.roundDuration, () => {
      this.endRound();
    });

    this.emitState();
    this.emitVoteProgress();
  }

  public castVote(playerId: string, vote: string) {
    const exists = this.votes.get(playerId);
    if (exists) return;
    this.votes.set(playerId, {
      vote,
      timeTaken: Date.now() - this.roundStartTime,
    });

    this.toPlayer(playerId, WSEvent.CH_ROUND_VOTED, {
      vote: vote,
    });

    this.emitVoteProgress();

    if (this.votes.size === this.scores.length) {
      this.clearPhaseTimer();
      this.endRound();
    }
  }


  private endRound() {
    this.state = GameState.ROUND_END;

    const counts: Record<string, number> = {};
    for (const { vote } of this.votes.values()) {
      const suspect = vote;
      if (suspect === Chameleon.skipVote) continue;
      if (counts[suspect]) {
        counts[suspect]++;
      } else {
        // Otherwise, initialize the count for that suspect to 1
        counts[suspect] = 1;
      }
    }

    this.counts = counts;

    const [suspect, maxVotes] =
      Object.entries(counts).sort((a, b) => b[1] - a[1])[0] || [];

    const isChameleon = suspect ? this.chameleons.includes(suspect) : false;

    if (isChameleon) {
      // ✅ Chameleon caught — voters get points
      for (const [voter, voteData] of this.votes.entries()) {
        if (voteData.vote !== suspect) continue;
        const bonus = Math.max(
          0,
          (1 - voteData.timeTaken / this.roundVotingDuration) *
            Chameleon.basePoints *
            Chameleon.timeBonusFactor,
        );
        this.updateScore(voter, Math.round(Chameleon.basePoints + bonus));
      }
    } else {
      // ❌ Chameleon wins
      for (const c of this.chameleons) {
        this.updateScore(c, Chameleon.basePoints);
      }
    }

    this.toHost(WSEvent.CH_ROUND_END, {
      state: this.state,
      round: this.buildRound({
        roles: Object.fromEntries(this.roles),
      }),
      scores: this.scores.sort((a, b) => b.score - a.score),
    });
    const room = RoomManager.get(this.roomId);
    if (room) {
      for (const player of room.players) {
        this.toPlayer(player.id, WSEvent.CH_ROUND_END, {
          state: this.state,
          round: this.buildRound({
            roles: this.roles.get(player.id) ? { [player.id]: this.roles.get(player.id)! } : {},
            myRole: this.roles.get(player.id),
            votes: {},
          }),
          scores: this.scores.sort((a, b) => b.score - a.score),
        });
      }
    }
    this.schedulePhaseTransition(4000, () => this.showChameleonReveal());
  }

  private showChameleonReveal() {
    this.state = GameState.REVEAL;
    this.emitState();

    this.schedulePhaseTransition(4000, () => {
      this.showLeaderboard();
    });
  }

  private showLeaderboard() {
    this.state = GameState.LEADERBOARD;
    this.emitState();

    this.schedulePhaseTransition(4000, () => {
      if (++this.currentRound >= this.noOfRounds) {
        this.finishGame();
      } else {
        this.showGetReadyScreen();
      }
    });
  }


  private showGetReadyScreen() {
    this.state = GameState.ROUND;
    this.emitState();

    this.schedulePhaseTransition(4000, () => this.startRound());
  }


  private finishGame() {
    this.state = GameState.RANKING;
    const sorted = this.scores.sort((a, b) => b.score - a.score);

    RoomManager.submitGameResult(this.roomId, sorted);
    this.emitState();
    this.schedulePhaseTransition(4000, () => this.endGame());
  }
}

function selectItem<T>(items: T[], label: string): T {
  // Validate input
  if (items.length !== 16) {
    throw new Error("Expected 16 items.");
  }
  if (!/^[A-D][1-4]$/.test(label)) {
    throw new Error("Label must be in the form A1–D4.");
  }

  const col = label.charCodeAt(0) - "A".charCodeAt(0); // A→0, B→1, C→2, D→3
  const row = parseInt(label[1]!, 10) - 1; // 1→0, 2→1, 3→2, 4→3
  const index = row * 4 + col;

  return items[index]!;
}
