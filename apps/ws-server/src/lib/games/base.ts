import { GameState, GameType, RoomState, Score, Scores, WSEvent, WSPayloads } from "@umati/ws";
import { Randomize } from "js-randomize";
import { nanoid } from "nanoid";
import { RoomManager } from "../room-manager";

export abstract class BaseGame {
  public readonly id: string;
  public readonly roomId: string;
  public readonly type: GameType;
  public state: GameState = "BEFORE";
  public readonly randomize = new Randomize(); 
  protected gameScore: Map<string, Score> = new Map();
  public currentRound = 0;
  public roundDuration: number = 30000;
  public roundStartTime = 0;
  public roundTimer?: NodeJS.Timeout;


  constructor(roomId: string, type: GameType) {
    this.id = nanoid();
    this.roomId = roomId;
    this.type = type;
  }

  get scores(): Scores {
    return Array.from(this.gameScore.values());
  }

  protected updateScore(playerId: string, points: number): void {
    const current = this.gameScore.get(playerId);
    if(!current) return;
    this.gameScore.set(playerId, {...current, score: current?.score! + points });
  }

  public addPlayer(playerId: string): void {
    const room = RoomManager.get(this.roomId);
    if (!room) return;

    const player = room.players.find((p) => p.id === playerId);
    if (!player) return;

    const score = this.gameScore.get(playerId);
    if (score) return;

    this.gameScore.set(player.id, {id: player.id, displayName: player.displayName, score: 0,});
  }



  /** Broadcast a WS event to everyone in the room */
  protected broadcast<E extends WSEvent>(event: E, payload: WSPayloads[E & keyof WSPayloads]) {
    RoomManager.broadcast(this.roomId, event, payload);
  }

  /** Broadcast only to host */
  protected toHost<E extends WSEvent>(event: E, payload: WSPayloads[E & keyof WSPayloads]) {
    RoomManager.toHost(this.roomId, event, payload);
  }

    /** Broadcast only to host */
  protected toPlayer<E extends WSEvent>(playerId: string, event: E, payload: WSPayloads[E & keyof WSPayloads]) {
    RoomManager.toPlayer(this.roomId, playerId, event, payload);
  }

  /** Update room UI state */
  protected setRoomState(state: RoomState) {
    RoomManager.updateState(this.roomId, state);
  }

  /** Common teardown */
  public endGame() {
    this.state = GameState.GAME_END;
    this.broadcast(WSEvent.GAME_END, {});
    RoomManager.setGame(this.roomId, null);
  }

  // 👇 must be implemented by concrete games
  public abstract startGame(): void;
}