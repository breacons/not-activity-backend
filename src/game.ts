import e from "express";
import { Server } from "socket.io";
import { WebRTCController } from "./webRTC";

const mockQuestions = ["elephant", "pizza", "spaceship"];
export type Player = {
  id: string;
  name: string;
  webRtc: any;
};

export enum RoundType {
  draw = "draw",
  talk = "talk",
  show = "show",
}
const roundTypeOrder = [RoundType.draw, RoundType.show, RoundType.talk];

export type Round = {
  roundNumber: number;
  timeLeft: number;
  activePlayer: string;
  roundType: RoundType;
  answer: string;
  winner: string;
};

export type Game = {
  id: string;
  round: number;
  rounds: Round[];
  players: Player[];
};

export class GameController {
  players: { [playerId: string]: any } = {};
  activeGames: { [gameId: string]: Game } = {};
  webRtcController: WebRTCController;

  constructor(io: Server) {
    this.webRtcController = new WebRTCController(io);
  }

  private createGameInfo(game: Game) {
    return {
      id: game.id,
      players: game.players,
    };
  }

  private getAllPlayersInGame(game: Game): Player[] {
    return game.players;
  }

  private getNextRound(game: Game): Round {
    const previousRound = game.rounds[game.round];
    return {
      roundNumber: game.round + 1,
      timeLeft: 60,
      activePlayer:
        game.players[
          (game.players.findIndex((p) => p.id === previousRound.activePlayer) +
            1) %
            game.players.length
        ].id,
      roundType:
        roundTypeOrder[
          (roundTypeOrder.findIndex(
            (type) => type === previousRound.roundType
          ) +
            1) %
            roundTypeOrder.length
        ],
      answer:
        mockQuestions[
          (mockQuestions.indexOf(previousRound.answer) + 1) %
            mockQuestions.length
        ],
      winner: undefined,
    };
  }

  createGame(creator: Player) {
    const game: Game = {
      id: `game-${Date.now()}`,
      round: 0,
      rounds: [],
      players: [creator],
    };

    this.players[creator.id] = { game: game.id, player: creator };
    this.activeGames[game.id] = game;
    this.webRtcController.send([creator], this.createGameInfo(game));
  }

  joinGame(gameId: string, player: Player) {
    const game = this.activeGames[gameId];
    if (game) {
      this.players[player.id] = { game: game.id, player };
      game.players.push(player);
    }
    this.webRtcController.send(
      this.getAllPlayersInGame(game),
      this.createGameInfo(game)
    );
  }

  startGame(gameId: string) {
    const game = this.activeGames[gameId];
    if (game) {
      const round: Round = {
        roundNumber: 0,
        timeLeft: 60,
        activePlayer: game.players[0].id,
        roundType: RoundType.draw,
        answer: mockQuestions[0],
        winner: undefined,
      };
      game.rounds.push(round);
      game.round = 0;

      this.webRtcController.send(
        this.getAllPlayersInGame(game),
        this.createGameState(game)
      );
    }
  }
  createGameState(game: Game): any {
    const gameState = { ...game };
    gameState.rounds = game.rounds.map((round) => ({
      ...round,
      answer: undefined,
    }));

    return gameState;
  }

  getGameInfo(gameId: string) {
    const game = this.activeGames[gameId];

    return game ? this.createGameInfo(game) : undefined;
  }

  getGameState(gameId: string) {
    const game = this.activeGames[gameId];
    if (game) {
      return this.createGameState(game);
    }
  }

  sendSolution(solution: string, gameId: string, player: Player) {
    const game = this.activeGames[gameId];
    if (game) {
      const currentRound = game.rounds[game.round];
      const correctSolution = currentRound.answer;

      if (solution === correctSolution) {
        currentRound.winner = player.id;
        game.rounds.push(this.getNextRound(game));
        game.round = game.round + 1;
      }

      this.webRtcController.send(
        this.getAllPlayersInGame(game),
        this.createGameState(game)
      );
    }
  }
}
