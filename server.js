const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let users = {};

io.on('connection', (socket) => {
    console.log(`User ${socket.id} connected`);

    users[socket.id] = { cursorPosition: null };

    socket.emit('test', 'Hello from server');

    // Listen for changes from any client
    socket.on('textChange', (data) => {
        // broadcast changes to all other clients
        socket.emit('textChange', data);
    });

    socket.on('cursorMove', (data) => {
        console.log(JSON.stringify(data));
        socket.broadcast.emit('cursorMove', data);
    });

    socket.on('disconnect', () => {
        console.log(`User ${socket.id} disconnected`);
    });
});

server.listen(4000, () => {
    console.log('listening on *:4000');
});
