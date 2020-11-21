import express from "express";
import * as httpserver from "http";
import cors from "cors";
import { Server } from "socket.io";
import { GameController } from "./game";
import SocketController from "./socket";
const port = 3000;

const app = express();
app.use(cors());

const http = httpserver.createServer(app);
const io = new Server(http, {
  cors: {
    origin: "*",
  },
});

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

const _socketController = new SocketController(io, new GameController());

http.listen(port, () => {
  return console.log(`server is listening on ${port}`);
});
