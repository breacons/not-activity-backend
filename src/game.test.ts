import { GameController, Player, Team } from "./game";

describe("Game engine", () => {
  const player: Player = {
    id: "test",
    name: "Bela",
    webRtc: {},
    score: 0,
    team: Team.BLUE,
    emoji: "😍",
  };

  const player2: Player = {
    id: "test2",
    name: "Jozsi",
    webRtc: {},
    score: 0,
    team: Team.RED,
    emoji: "😍",
  };

  it("Should create a new Game", () => {
    const gameController = new GameController();

    const gameInfo = gameController.createGame(player);

    expect(gameInfo.players).toHaveLength(1);
    expect(gameInfo.players).toContain(player);
    expect(gameInfo.id).toBeDefined();
  });

  it("Should join an existing game", () => {
    const gameController = new GameController();

    let gameInfo = gameController.createGame(player);

    gameInfo = gameController.joinGame(gameInfo.id, player2);
    expect(gameInfo.players).toHaveLength(2);
  });

  it("Should start a game", () => {
    const gameController = new GameController();

    let gameInfo = gameController.createGame(player);
    gameInfo = gameController.joinGame(gameInfo.id, player2);

    const gameState = gameController.startGame(player.id);
    expect(gameState.rounds).toHaveLength(1);
    expect(gameState.round).toEqual(0);
    expect(gameState.rounds[0].activePlayer).toEqual(player);
  });

  it("Should handle submitting a correct solution", () => {
    const gameController = new GameController();

    let gameInfo = gameController.createGame(player);
    gameInfo = gameController.joinGame(gameInfo.id, player2);

    let _gameState = gameController.startGame(player.id);

    const {gameState, isCorrect} = gameController.sendSolution("elephant", player.id);
    expect(gameState.rounds).toHaveLength(2);
    expect(gameState.round).toEqual(1);
    expect(gameState.rounds[1].activePlayer).toEqual(player2);
    expect(gameState.players.find((p) => p.id === player.id).score).toEqual(1);
  });

  it("Should handle time ticks", () => {
    const gameController = new GameController();

    let gameInfo = gameController.createGame(player);
    gameInfo = gameController.joinGame(gameInfo.id, player2);

    let gameState = gameController.startGame(player.id);

    gameState = gameController.gameTick(player.id);
    expect(gameState.rounds[gameState.round].timeLeft).toEqual(59);
  });
});
