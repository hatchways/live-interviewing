const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let users = {};

io.on('connection', (socket) => {
    users[socket.id] = { cursorPosition: null, name: '', filePosition: ''};

    socket.on('user_join', (userName) => {
        users[socket.id]['name'] = userName
        socket.emit('all_users', {'allOnlineUsers': users, 'newUserJoined': userName});
    });

    socket.on('user_click_on_file', (fileUri) => {
        users[socket.id]['filePosition'] = fileUri
        console.log("event emitted!!!!", {'allOnlineUsers': users, 'newFileClicked': fileUri, 'userClickedOnFile': socket.id})
        socket.emit('user_click_on_file', {'allOnlineUsers': users, 'newFileClicked': fileUri, 'userClickedOnFile': socket.id});
    })

    socket.on('disconnect', () => {
        console.log(`User ${socket.id} disconnected`);
    });
});

server.listen(4000, () => {
    console.log('listening on *:4000');
});