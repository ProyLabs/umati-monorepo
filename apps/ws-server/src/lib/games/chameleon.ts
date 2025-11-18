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
import { GameManager } from "../game-manager";
import { chameleonCategories } from "./chameleon-categories";

export class Chameleon extends BaseGame {
  static maxRounds = 10;
  static basePoints = 100;

  public noOfRounds: number;
  public noOfChameleons: number;

  private categories = chameleonCategories;
  private roles: Map<string, ChameleonRoundRole> = new Map();
  private votes: Map<string, string> = new Map();
  private counts: Record<string, number> = {};
  private chameleons: string[] = [];
  private currentCategory?: ChameleonCategory;
  private secretWord = { word: "", position: "" };
  private speakingOrder?: ChameleonRound['speakingOrder'];
  private roundSpeakingDuration: number = 0;
  private roundVotingDuration: number = 0;

  get round(): ChameleonRound {
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
      votes: Object.fromEntries(this.votes),
      counts: this.counts,
    };
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
    this.roundVotingDuration = (options.votingDuration ?? 60) * 1000;
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

    // 🧩 Announce round start
    this.broadcast(WSEvent.CH_ROUND_START, {
      state: this.state,
      round: this.round,
    });
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
    this.roundTimer = setTimeout(() => {
      this.startVoting();
    }, this.roundDuration);

    this.broadcast(WSEvent.GAME_STATE, GameManager.toGameState(this.id)!);
  }

  public startVoting() {
    if (this.state !== GameState.SPEAKING) return;
    this.state = GameState.VOTING;

    const room = RoomManager.get(this.roomId);
    if (!room) return;

    this.roundStartTime = Date.now();
    this.roundDuration = this.roundVotingDuration;
    if (this.roundTimer) { clearTimeout(this.roundTimer); }
    this.roundTimer = setTimeout(() => {
      this.startVoting();
    }, this.roundDuration);

    this.broadcast(WSEvent.GAME_STATE, GameManager.toGameState(this.id)!);
  }

  public castVote(playerId: string, vote: string) {
    const exists = this.votes.get(playerId);
    if (exists) return;
    this.votes.set(playerId, vote);

    this.toPlayer(playerId, WSEvent.CH_ROUND_VOTED, {
      vote: vote,
    });

    this.broadcast(WSEvent.GAME_STATE, GameManager.toGameState(this.id)!);


    if (this.votes.size === this.scores.length) {
      if (this.roundTimer) { clearTimeout(this.roundTimer); }

      setTimeout(() => {
        this.endRound();
      }, 1500);
    }
  }


  private endRound() {
    this.state = GameState.ROUND_END;

    const counts: Record<string, number> = {};
    for (const suspect of this.votes.values()) {
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
      for (const [voter, vote] of this.votes.entries()) {
        if (vote === suspect)
          this.updateScore(voter, Chameleon.basePoints);
      }
    } else {
      // ❌ Chameleon wins
      for (const c of this.chameleons) {
        this.updateScore(c, Chameleon.basePoints);
      }
    }

    this.broadcast(WSEvent.GAME_STATE, GameManager.toGameState(this.id)!);

    setTimeout(() => this.showChameleonReveal(), 4000);
  }

  private showChameleonReveal() {
    this.state = GameState.REVEAL;
    this.broadcast(WSEvent.GAME_STATE, GameManager.toGameState(this.id)!);

    setTimeout(() => {
      this.showLeaderboard();
    }, 4000);
  }

  private showLeaderboard() {
    this.state = GameState.LEADERBOARD;
    this.broadcast(WSEvent.GAME_STATE, GameManager.toGameState(this.id)!);

    setTimeout(() => {
      if (++this.currentRound >= this.noOfRounds) {
        this.finishGame();
      } else {
        this.showGetReadyScreen();
      }
    }, 4000);
  }


  private showGetReadyScreen() {
    this.state = GameState.ROUND;
    this.broadcast(WSEvent.GAME_STATE, GameManager.toGameState(this.id)!);

    setTimeout(() => this.startRound(), 4000);
  }


  private finishGame() {
    this.state = GameState.RANKING;
    const sorted = this.scores.sort((a, b) => b.score - a.score);
    const top3 = sorted.slice(0, 3);
    while (top3.length < 3) top3.push({ id: "", displayName: "", score: 0 });

    RoomManager.submitGameResult(this.roomId, top3);
    setTimeout(() => this.endGame(), 4000);
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
