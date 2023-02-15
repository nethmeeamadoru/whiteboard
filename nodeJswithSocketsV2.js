const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

const PORT = process.env.PORT || 3000;

app.use(express.static(__dirname + "/public"));

let history = [];
let historyIndex = 0;

io.on("connection", (socket) => {
  console.log("a user connected");

  // Send the history to the newly connected user
  socket.emit("history", history);

  socket.on("draw", (data) => {
    io.emit("draw", data);
  });

  socket.on("note", (data) => {
    io.emit("note", data);
  });

  socket.on("undo", () => {
    if (historyIndex > 0) {
      historyIndex--;
      const imageData = history[historyIndex];
      io.emit("undo", imageData);
    }
  });

  socket.on("redo", () => {
    if (historyIndex < history.length - 1) {
      historyIndex++;
      const imageData = history[historyIndex];
      io.emit("redo", imageData);
    }
  });

  socket.on("clear", () => {
    history = [];
    historyIndex = 0;
    io.emit("clear");
  });

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

http.listen(PORT, '0.0.0.0', () => {
  console.log(`listening on http://localhost:${PORT}`);
});
