import express from "express";
import * as httpserver from 'http';
import { Server } from 'socket.io';
import { GameController } from "./game";
import WebRTCController from "./webRTC";
const port = 3000;

const app = express()
const http = httpserver.createServer(app);
const io = new Server(http);

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

const _socketController = new WebRTCController(io, new GameController(io));

http.listen(port, () => {
  return console.log(`server is listening on ${port}`);
});
