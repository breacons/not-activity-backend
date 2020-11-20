import express from "express";
import * as httpserver from 'http';
import { Server } from 'socket.io';
const port = 3000;

const app = express()
const http = httpserver.createServer(app);
const io = new Server(http);

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});


io.on("connection", (socket) => {
  console.log("a user connected");
  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

http.listen(port, () => {
  return console.log(`server is listening on ${port}`);
});
