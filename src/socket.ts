import { Server, Socket } from "socket.io";
import { GameController, Player, Team } from "./game";

export type PlayerPayload = { name: string; webRTC: any };
export default class SocketController {
  constructor(private io: Server, private gameController: GameController) {
    io.on("connection", (socket) => this.onConnect(socket));
  }

  onConnect(socket: Socket) {
    console.log("Client connected: " + socket.id);
    socket.on("disconnect", () => this.onDisconnect(socket));
    socket.on("createGame", (payload) => this.onCreateGame(socket, payload));
    socket.on("joinGame", (payload) => this.onJoinGame(socket, payload));
    socket.on("startGame", (payload) => this.onStartGame(socket, payload));
    socket.on("solution", (payload) => this.onSolution(socket, payload));
    socket.on("tick", (payload) => this.onTick(socket, payload));
    socket.on("signal", (payload) => this.onSignal(socket, payload));
    socket.on("initSend", (payload) => this.onInitSend(socket, payload));
  }

  onDisconnect(socket: Socket) {
    console.log("Client disconnected: " + socket.id);
    const lastActiveGameId = this.gameController.getPlayerGameId(socket.id);
    this.io.to(lastActiveGameId).emit("removePeer", socket.id);
    socket.leave(lastActiveGameId);
    this.gameController.leaveGame(socket.id);
  }

  onCreateGame(socket: Socket, payload: PlayerPayload) {
    console.log(`Creating game by ${socket.id} - ${payload.name}`);
    const player: Player = {
      id: socket.id,
      name: payload.name,
      webRtc: payload.webRTC,
      score: 0,
      team: Team.BLUE,
    };

    const gameInfo = this.gameController.createGame(player);
    console.log(`Game created`, gameInfo);
    socket.join(gameInfo.id);
    this.io.to(gameInfo.id).emit("gameInfo", gameInfo);
  }

  onJoinGame(socket: Socket, payload: { player: PlayerPayload; room: string }) {
    console.log(`Joining game ${socket.id}; game: ${payload.room}`);
    const player: Player = {
      id: socket.id,
      name: payload.player.name,
      webRtc: payload.player.webRTC,
      score: 0,
      team: Team.RED, // TODO fix this!
    };
    const gameInfo = this.gameController.joinGame(payload.room, player);
    if (gameInfo) {
      socket.join(gameInfo.id);
      console.log(`${player.name} joined ${payload.room}`, gameInfo);
      this.io.to(gameInfo.id).emit("gameInfo", gameInfo);
      socket.to(gameInfo.id).emit("initReceive", socket.id);
    }
  }

  onStartGame(socket: Socket, payload: {}) {
    const gameState = this.gameController.startGame(socket.id);
    if (gameState) {
      this.io.to(gameState.id).emit("gameState", gameState);
      console.log("Game started", gameState);
    }
  }

  onTick(socket: Socket, payload: {}) {
    const gameState = this.gameController.gameTick(socket.id);
    if (gameState) {
      this.io.to(gameState.id).emit("gameState", gameState);
    }
  }

  onSolution(socket: Socket, payload: { solution: string }) {
    const gameState = this.gameController.sendSolution(
      payload.solution,
      socket.id
    );
    if (gameState) {
      this.io.to(gameState.id).emit("solution", payload.solution);
      this.io.to(gameState.id).emit("gameState", gameState);
      console.log("Solution submitted", gameState);
    }
  }

  onSignal(socket: Socket, payload: { signal: any; socket_id: string }) {
    console.log("sending signal from " + socket.id + " to ", payload.signal);
    this.io.to(payload.socket_id).emit("signal", {
      socket_id: socket.id,
      signal: payload.signal,
    });
  }

  onInitSend(socket: Socket, payload: { init_socket_id: string }) {
    console.log("INIT SEND by " + socket.id + " for " + payload.init_socket_id);
    this.io.to(payload.init_socket_id).emit("initSend", socket.id);
  }
}
