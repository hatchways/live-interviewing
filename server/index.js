const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let users = {};
let files = {}

io.on("connection", (socket) => {
  users[socket.id] = { cursorPosition: null, name: "Anonymous", filePosition: "", color: random_rgba() };

  console.log("user connecting to socket", socket.id);

  socket.on("user_join", (userName) => {
    users[socket.id]["name"] = userName;
    io.emit("all_users", {
      allOnlineUsers: users,
    });
    socket.broadcast.emit("user_join", `${userName} has joined the interview.`)
  });

  socket.on("user_click_on_file", (fileUri) => {
    users[socket.id]["filePosition"] = fileUri;

    if (!fileUri || fileUri?.fsPath === undefined){
      return;
    }

    removeUserFromFiles(socket);

    if (fileUri.fsPath in files && files[fileUri.fsPath]?.users){
      files[fileUri.fsPath]["users"].push(socket.id);
    } else {
      files[fileUri.fsPath] = {"uri": fileUri, "users": [socket.id]}
    }

    console.log("files here", files);

    io.emit("user_click_on_file", {
      allOnlineUsers: users,
      newFileClicked: fileUri,
      userPerformingThisAction: socket.id,
      files
    });
  });

  socket.on("user_cursor_move", (data) => {
    users[socket.id]['cursorPosition'] = data;
    socket.broadcast.emit("user_cursor_move", {
        allOnlineUsers: users,
        newCursorPosition: data,
        userPerformingThisAction: socket.id
      });
  });

  socket.on("disconnect", () => {
    const userName = users[socket.id]?.name;
    socket.broadcast.emit("user_leave", `${userName} has left the interview.`)

    removeUserFromFiles(socket);
    delete users[socket.id]

    io.emit("all_users", {  
      allOnlineUsers: users,
    });
  });
});

server.listen(4000, () => {
  console.log("listening on *:4000");
});


const removeUserFromFiles = (socket) => {
    // Remove from previous file
    const previousFileClicked = users[socket.id]["filePosition"];
    const usersInPreviousFile = previousFileClicked.fsPath in files ? files[previousFileClicked.fsPath]["users"] : [];
    const index = usersInPreviousFile.findIndex(id => id === socket.id);
    if (index > -1){
      usersInPreviousFile.splice(index, 1);
    }    
}

function random_rgba() {
  // Generate a random RGB color associated with that user
  const randomBetween = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
  const r = randomBetween(0, 255);
  const g = randomBetween(0, 255);
  const b = randomBetween(0, 255);
  return { r, g, b };
}