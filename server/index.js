const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let users = {};
let files = {};

io.on("connection", (socket) => {
  users[socket.id] = {
    cursorPosition: null,
    name: "Anonymous",
    filePosition: "",
    color: random_rgba(),
  };

  socket.on("joinSession", async ({sessionId, userName}) => {
    await socket.join(sessionId);
    console.log(`Socket ${socket.id} with name ${userName} joined room ${sessionId}`);
    socket.to(sessionId).emit("userReady", `${userName} has joined the interview.`);
  });

  socket.on("fileClick", ({sessionId, fileUri}) => {
    removeUserFromFiles(socket);
    users[socket.id]["filePosition"] = fileUri;

    if (!fileUri || fileUri?.fsPath === undefined) {
      return;
    }

    if (fileUri.fsPath in files && files[fileUri.fsPath]?.users) {
      files[fileUri.fsPath]["users"].push(socket.id);
    } else {
      files[fileUri.fsPath] = { uri: fileUri, users: [socket.id] };
    }

    io.sockets.in(socket.room).emit("fileClick", {
      allOnlineUsers: users,
      newFileClicked: fileUri,
      userPerformingThisAction: socket.id,
      files,
    });

    console.log(`Socket ${socket.id} of room ${sessionId} clicked on file ${fileUri.fsPath}`);
  });

  socket.on("cursorMove", ({
    sessionId,
    selections,
    socketId,
    filePath
  }) => {
    users[socket.id]["cursorPosition"] = { selections, socketId, filePath }
    socket.to(sessionId).emit("cursorMove", {
      allOnlineUsers: users,
      newCursorPosition: users[socket.id]["cursorPosition"],
      userPerformingThisAction: socket.id,
    });

    console.log(`Socket ${socket.id} of room ${sessionId} moved cursor`);
  });

  socket.on("disconnect", (sessionId) => {
    removeUserFromFiles(socket);
    const userName = users[socket.id]?.name;
    socket.to(sessionId).emit("userLeave", `${userName} has left the interview.`);

    delete users[socket.id];

    socket.leave(sessionId)
    console.log(`Socket ${socket.id} of room ${sessionId} left`);
  });
});

server.listen(4000, () => {
  console.log("listening on *:4000");
});

const removeUserFromFiles = (socket) => {
  // Remove from previous file
  const previousFileClicked = users[socket.id]["filePosition"];
  const usersInPreviousFile =
    previousFileClicked.fsPath in files
      ? files[previousFileClicked.fsPath]["users"]
      : [];
  const index = usersInPreviousFile.findIndex((id) => id === socket.id);
  if (index > -1) {
    usersInPreviousFile.splice(index, 1);
  }
};

function random_rgba() {
  // Generate a random RGB color associated with that user
  const randomBetween = (min, max) =>
    min + Math.floor(Math.random() * (max - min + 1));
  const r = randomBetween(0, 255);
  const g = randomBetween(0, 255);
  const b = randomBetween(0, 255);
  return { r, g, b };
}
