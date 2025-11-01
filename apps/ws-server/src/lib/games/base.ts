import { WSEvent } from "@umati/ws";
import { nanoid } from "nanoid";
import { GameType } from "../game-manager";
import { RoomManager } from "../room-manager";

export abstract class BaseGame {
  public readonly id: string;
  public readonly roomId: string;
  public readonly type: GameType;
  public state: string = "BEFORE";

  constructor(roomId: string, type: GameType) {
    this.id = nanoid();
    this.roomId = roomId;
    this.type = type;
  }

  /** Broadcast a WS event to everyone in the room */
  protected broadcast(event: WSEvent, payload: any) {
    RoomManager.broadcast(this.roomId, event, payload);
  }

  /** Broadcast only to host */
  protected toHost(event: WSEvent, payload: any) {
    RoomManager.toHost(this.roomId, event, payload);
  }

  /** Update room UI state */
  protected setRoomState(state: "LOBBY" | "PLAYING" | "ENDED") {
    RoomManager.updateState(this.roomId, state);
  }

  /** Common teardown */
  public endGame() {
    this.state = "GAME_END";
    this.broadcast(WSEvent.GAME_END, {});
    RoomManager.setGame(this.roomId, null);
  }

  // 👇 must be implemented by concrete games
  public abstract startGame(): void;
}