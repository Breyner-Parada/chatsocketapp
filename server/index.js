// const express = require('express');

// const app = express();
// const port = 3000;
// const server = require('http').Server(app);
// const io = require('socket.io')(server)

const express = require("express");
const socketio = require("socket.io");
const http = require("http");
const router = require("./router");
const { addUser, removeUser, getUser, getUsersInRoom } = require("./users");

const port = process.env.PORT || 3001;
const app = express();
const server = http.createServer(app);
const io = socketio(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(express.json());
app.use(router);

io.on("connection", (socket) => {
  console.log("Client connected");
  socket.on("join", ({ name, room }, cb) => {
    const { error, user } = addUser({ id: socket.id, name, room });

    if (error) return cb(error);
    socket.join(user.room);

    socket.emit("message", {
      user: "admin",
      text: `${user.name}, Welcome to the room ${user.room}`,
    });
    socket.broadcast
      .to(user.room)
      .emit("message", {
        user: "admin",
        text: `${user.name} has joined the room ${user.room}`,
      });

      io.to(user.room).emit('roomData', {room: user.room, users: getUsersInRoom(user.room)});

    cb();
  });
  socket.on("sendMessage", (message, cb) => {
    const user = getUser(socket.id);

    io.to(user.room).emit("message", { user: user.name, text: message });
    io.to(user.room).emit("roomData", { room: user.room, users: getUsersInRoom(user.room) });

    cb();
  });
  socket.on("disconnect", () => {
    console.log('User disconnected');
   const user = removeUser(socket.id);

   if(user) {
    io.to(user.room).emit("message", { user: 'admin', text: `${user.name} has disconnected` });
   }
  });
});

server.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
