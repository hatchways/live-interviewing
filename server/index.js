const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let users = {};

io.on("connection", (socket) => {
  users[socket.id] = { cursorPosition: null, name: "", filePosition: "" };

  socket.on("user_join", (userName) => {
    users[socket.id]["name"] = userName;
    socket.emit("all_users", {
      allOnlineUsers: users,
      newUserJoined: userName,
    });
  });

  socket.on("user_click_on_file", (fileUri) => {
    const previousFileClicked = users[socket.id]["filePosition"];
    users[socket.id]["filePosition"] = fileUri;
    socket.emit("user_click_on_file", {
      allOnlineUsers: users,
      newFileClicked: fileUri,
      userPerformingThisAction: socket.id,
      previousFileClicked: previousFileClicked,
    });
  });

  socket.on("user_cursor_move", (data) => {
    users[socket.id][cursorPosition] = data;
    socket.emit("user_cursor_move", {
        allOnlineUsers: users,
        newCursorPosition: data,
        userPerformingThisAction: socket.id
      });
  });

  socket.on("disconnect", () => {
    console.log(`User ${socket.id} disconnected`);
  });
});

server.listen(4000, () => {
  console.log("listening on *:4000");
});
