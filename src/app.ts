import express from "express";
import * as httpserver from "http";
import cors from "cors";
import { Server } from "socket.io";
import { GameController } from "./game";
import SocketController from "./socket";
import path from "path";
const port = process.env.port || 8080;

const app = express();
app.use(cors({ credentials: true }));

const http = httpserver.createServer(app);
const io = new Server(http, {
  cors: {
    origin: [
      "http://localhost:3000",
      "https://storage.googleapis.com/hacktivity-app/",
      "https://storage.googleapis.com"
    ],
    credentials: true,
  },
});

// app.use(express.static(path.resolve("./") + "/dist/public"));

app.get("/", (req, res) => {
  res.send("Welcome to the magical API");
});

/* app.get("*", (req, res) => {
  res.sendFile(path.resolve("./") + "/dist/public/index.html");
}); */

const _socketController = new SocketController(io, new GameController());

http.listen(port, () => {
  return console.log(`server is listening on ${port}`);
});
