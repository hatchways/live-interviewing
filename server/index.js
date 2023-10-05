const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let users = {};
let files = {}

io.on("connection", (socket) => {
  const randomColor = "#" + Math.floor(Math.random()*16777215).toString(16); 
  users[socket.id] = { cursorPosition: null, name: "Anonymous", filePosition: "", color: randomColor };

  socket.on("user_join", (userName) => {
    users[socket.id]["name"] = userName;
    io.emit("all_users", {
      allOnlineUsers: users,
    });
    socket.broadcast.emit("user_join", `${userName} has joined the interview.`)
  });

  socket.on("user_click_on_file", (fileUri) => {
    const previousFileClicked = users[socket.id]["filePosition"];
    users[socket.id]["filePosition"] = fileUri;

    if (!fileUri || fileUri?.fsPath === undefined){
      return;
    }

    if (fileUri.fsPath in files && fileUri.fsPath && files[fileUri.fsPath]?.users){
      files[fileUri.fsPath]["users"].push(socket.id);
    } else {
      files[fileUri.fsPath] = {"uri": fileUri, "users": [socket.id]}
    }

    console.log("files!!!!", files);

    // Remove from previous file
    const usersInPreviousFile = previousFileClicked.fsPath in files ? files[previousFileClicked.fsPath]["users"] : [];

    const index = usersInPreviousFile.findIndex(id => id === socket.id);
    if (index > -1){
      usersInPreviousFile.splice(index, 1);
    }
    // files[previousFileClicked.fsPath] = usersInPreviousFile;
    
    io.emit("user_click_on_file", {
      allOnlineUsers: users,
      newFileClicked: fileUri,
      userPerformingThisAction: socket.id,
      files
    });
  });

  socket.on("user_cursor_move", (data) => {
    users[socket.id]['cursorPosition'] = data;
    io.emit("user_cursor_move", {
        allOnlineUsers: users,
        newCursorPosition: data,
        userPerformingThisAction: socket.id
      });
  });

  socket.on("disconnect", () => {
    const userName = users[socket.id]?.name;
    delete users[socket.id]
    socket.broadcast.emit("user_leave", `${userName} has left the interview.`)

    io.emit("all_users", {
      allOnlineUsers: users,
    });
  });
});

server.listen(4000, () => {
  console.log("listening on *:4000");
});
