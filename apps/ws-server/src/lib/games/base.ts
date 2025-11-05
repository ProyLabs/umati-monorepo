import { GameState, RoomState, WSEvent, WSPayloads } from "@umati/ws";
import { nanoid } from "nanoid";
import { GameType } from "../game-manager";
import { RoomManager } from "../room-manager";

export abstract class BaseGame {
  public readonly id: string;
  public readonly roomId: string;
  public readonly type: GameType;
  public state: GameState = "BEFORE";

  constructor(roomId: string, type: GameType) {
    this.id = nanoid();
    this.roomId = roomId;
    this.type = type;
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

  public addPlayer(playerId: string) {
    
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