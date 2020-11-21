import { Server, Socket } from "socket.io";
import { GameController, Player } from "./game";

export type PlayerPayload = { name: string; webRTC: any };
export default class WebRTCController {
  constructor(io: Server, private gameController: GameController) {
    io.on("connection", (socket) => this.onConnect(socket));
  }

  onConnect(socket: Socket) {
    console.log("Client connected: " + socket.id);
    socket.on("disconnect", () => this.onDisconnect(socket));
    socket.on("createGame", (payload) => this.onCreateGame(socket, payload));
    socket.on("joinGame", (payload) => this.onJoinGame(socket, payload));
    socket.on("startGame", (payload) => this.onStartGame(socket, payload));
    socket.on("solution", (payload) => this.onSolution(socket, payload));
  }

  onDisconnect(socket: Socket) {
    console.log("Client disconnected: " + socket.id);
  }

  onCreateGame(socket: Socket, payload: PlayerPayload) {
    const player: Player = {
      id: socket.id,
      name: payload.name,
      webRtc: payload.webRTC,
    };

    const gameInfo = this.gameController.createGame(player);
    socket.join(gameInfo.id);
    socket.to(gameInfo.id).emit("gameInfo", gameInfo);
  }

  onJoinGame(socket: Socket, payload: { player: PlayerPayload; room: string }) {
    const player: Player = {
      id: socket.id,
      name: payload.player.name,
      webRtc: payload.player.webRTC,
    };
    const gameInfo = this.gameController.joinGame(payload.room, player);
    socket.join(gameInfo.id);
    socket.to(gameInfo.id).emit("gameInfo", gameInfo);
  }

  onStartGame(socket: Socket, payload: { gameId: string }) {
    const gameState = this.gameController.startGame(payload.gameId);
    socket.to(payload.gameId).emit("gameState", gameState);
  }

  onSolution(socket: Socket, payload: { solution: string; gameId: string }) {
    const gameState = this.gameController.sendSolution(
      payload.solution,
      payload.gameId,
      socket.id
    );
    socket.to(payload.gameId).emit("gameState", gameState);
  }
}
