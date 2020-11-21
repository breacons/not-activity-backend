import { GameController, Player } from "./game";
import WebRTCController from "./socket";
jest.mock("./webRTC");

describe("Game engine", () => {
  it("Should create a new Game", () => {
    const gameController = new GameController();
    const player: Player = {
      id: "test",
      name: "Bela",
      webRtc: {},
    };

    const gameInfo = gameController.createGame(player);

    expect(gameInfo.players).toHaveLength(1);
    expect(gameInfo.players).toContain(player);
    expect(gameInfo.id).toBeDefined();
  });

  it("Should join an existing game", () => {
    const gameController = new GameController();
    const player: Player = {
      id: "test",
      name: "Bela",
      webRtc: {},
    };

    const player2: Player = {
      id: "test2",
      name: "Jozsi",
      webRtc: {},
    };

    let gameInfo = gameController.createGame(player);

    gameInfo = gameController.joinGame(gameInfo.id, player2);
    expect(gameInfo.players).toHaveLength(2);
  });

  it("Should start a game", () => {
    const gameController = new GameController();
    const player: Player = {
      id: "test",
      name: "Bela",
      webRtc: {},
    };

    const player2: Player = {
      id: "test2",
      name: "Jozsi",
      webRtc: {},
    };

    let gameInfo = gameController.createGame(player);
    gameInfo = gameController.joinGame(gameInfo.id, player2);

    const gameState = gameController.startGame(gameInfo.id);
    expect(gameState.rounds).toHaveLength(1);
    expect(gameState.round).toEqual(0);
    expect(gameState.rounds[0].activePlayer).toEqual(player.id);
  });

  it("Should handle submitting a correct solution", () => {
    const gameController = new GameController();
    const player: Player = {
      id: "test",
      name: "Bela",
      webRtc: {},
    };

    const player2: Player = {
      id: "test2",
      name: "Jozsi",
      webRtc: {},
    };

    let gameInfo = gameController.createGame(player);
    gameInfo = gameController.joinGame(gameInfo.id, player2);

    let gameState = gameController.startGame(gameInfo.id);


    gameState = gameController.sendSolution(
      "elephant",
      gameInfo.id,
      player.id
    );
    expect(gameState.rounds).toHaveLength(2);
    expect(gameState.round).toEqual(1);
    expect(gameState.rounds[1].activePlayer).toEqual(player2.id);
  });
});
