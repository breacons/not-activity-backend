import e from "express";
import { Server } from "socket.io";
import WebRTCController from "./socket";

const mockQuestions = ["elephant", "pizza", "spaceship"];

export enum Team {
  RED = "RED",
  BLUE = "BLUE",
}

export type Player = {
  id: string;
  name: string;
  score: number;
  webRtc: any;
  team: Team;
  emoji: string;
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
  activePlayer: Player;
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

export type GameStateRound = Omit<Round, "answer">;

export type GameState = Game & { rounds: GameStateRound[] };

export class GameController {
  players: { [playerId: string]: { game: string; player: Player } } = {};
  activeGames: { [gameId: string]: Game } = {};

  constructor() {}

  private createGameInfo(game: Game) {
    return {
      id: game.id,
      players: game.players,
    };
  }

  private getNextRound(game: Game): Round {
    const previousRound = game.rounds[game.round];
    return {
      roundNumber: game.round + 1,
      timeLeft: 60,
      activePlayer:
        game.players[
          (game.players.findIndex(
            (p) => p.id === previousRound.activePlayer.id
          ) +
            1) %
            game.players.length
        ],
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

  private getPlayerGame(playerId: string) {
    const gameId = this.getPlayerGameId(playerId);
    return this.activeGames && this.activeGames[gameId];
  }

  getTeamsInGame(gameId: string) {
    const game = this.activeGames[gameId];
    if (game) {
      return {
        [Team.BLUE]: game.players.filter((p) => p.team === Team.BLUE),
        [Team.RED]: game.players.filter((p) => p.team === Team.RED),
      };
    } else {
      return {
        [Team.BLUE]: [],
        [Team.RED]: [],
      };
    }
  }

  leaveGame(playerId: string) {
    const gameId = this.players[playerId]?.game;
    const game = this.activeGames[gameId];

    if (game) {
      game.players = game.players.filter((p) => p.id !== playerId);
      delete this.players[playerId];
      console.log("Removing player from game");
      if (!game.players.length) {
        delete this.activeGames[gameId];
        console.log("Cleaning up empty game");
      }
    }
  }

  getPlayerGameId(playerId: string) {
    return this.players[playerId]?.game;
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
    const gameInfo = this.createGameInfo(game);
    return gameInfo;
  }

  joinGame(gameId: string, player: Player) {
    const game = this.activeGames[gameId];
    if (game) {
      this.players[player.id] = { game: game.id, player };
      game.players.push(player);
      const gameInfo = this.createGameInfo(game);
      return gameInfo;
    }
  }

  startGame(playerId: string) {
    const game = this.getPlayerGame(playerId);
    if (game) {
      const round: Round = {
        roundNumber: 0,
        timeLeft: 60,
        activePlayer: game.players[0],
        roundType: RoundType.draw,
        answer: mockQuestions[0],
        winner: undefined,
      };
      game.rounds.push(round);
      game.round = 0;

      const gameState = this.createGameState(game);
      return gameState;
    }
  }

  gameTick(playerId: string) {
    const game = this.getPlayerGame(playerId);
    if (game) {
      const currentRound = game.rounds[game.round];
      if (currentRound.timeLeft > 0) {
        currentRound.timeLeft -= 1;
      } else {
        const nextRound = this.getNextRound(game);
        game.rounds.push(nextRound);
        game.round += 1;
      }
      return this.createGameState(game);
    }
  }

  createGameState(game: Game): GameState {
    const gameState = { ...game };
    return gameState;
  }

  getGameInfo(gameId: string) {
    const game = this.activeGames[gameId];
    return game;
  }

  getGameState(gameId: string) {
    const game = this.activeGames[gameId];
    if (game) {
      return this.createGameState(game);
    }
  }

  sendSolution(solution: string, playerId: string) {
    const game = this.getPlayerGame(playerId);
    if (game) {
      const currentRound = game.rounds[game.round];
      const correctSolution = currentRound.answer;
      if (solution === correctSolution) {
        currentRound.winner = playerId;
        const player = game.players.find((p) => p.id === playerId);
        player.score += 1;
        game.rounds.push(this.getNextRound(game));
        game.round = game.round + 1;
      }

      const gameState = this.createGameState(game);
      return gameState;
    }
  }
}
