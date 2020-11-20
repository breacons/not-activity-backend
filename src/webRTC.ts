import { Server } from "socket.io";
import { Player } from "./game";

export class WebRTCController {
  constructor(private io: Server) {}

  send(players: Player[], data: any) {
    throw new Error("Method not implemented.");
  }
}
