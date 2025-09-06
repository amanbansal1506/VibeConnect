const express = require('express');
const app = express();
const http = require('http').createServer(app);
const { Server } = require('socket.io');

// Allow CORS for frontend (adjust origin in production)
const io = new Server(http, {
  cors: {
    origin: "*", // change to "https://your-frontend.vercel.app" if frontend separate
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

const rooms = {}; 
const activeUsers = {};

io.on('connection', socket => {
  console.log(`User connected: ${socket.id}`);
  socket.emit('your-id', socket.id);
  socket.emit('room-list', Object.keys(rooms));

  socket.on('create-room', ({ roomName, key, username }) => {
    if (rooms[roomName]) {
      socket.emit('room-error', 'Room name already exists!');
      return;
    }

    if (Object.values(activeUsers).includes(username)) {
      socket.emit('room-error', 'Username is already taken.');
      return;
    }

    rooms[roomName] = { key, creator: username };
    activeUsers[socket.id] = username;

    socket.emit('room-created', roomName);
    io.emit('room-list', Object.keys(rooms));
  });

  socket.on('join-room', ({ roomName, key, username }) => {
    const room = rooms[roomName];

    if (!room) {
      socket.emit('room-error', 'Room does not exist.');
      return;
    }

    if (room.key !== key) {
      socket.emit('room-error', 'Incorrect key.');
      return;
    }

    if (Object.values(activeUsers).includes(username)) {
      socket.emit('room-error', 'Username is already taken.');
      return;
    }

    activeUsers[socket.id] = username;

    socket.join(roomName);
    socket.username = username;
    socket.room = roomName;

    socket.to(roomName).emit('user-joined', `${username} joined the room`);

    socket.on('send-message', msg => {
      const time = new Date().toLocaleTimeString();
      io.to(roomName).emit('chat-message', {
        user: username,
        text: msg,
        time
      });
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${username}`);
      socket.to(roomName).emit('user-left', `${username} left the room`);
      delete activeUsers[socket.id];
    });
  });

  socket.on('leave-room', ({ username, roomName }) => {
    socket.leave(roomName);
    socket.to(roomName).emit('user-left', `${username} left the room`);
    delete activeUsers[socket.id];
  });

  // Cleanup if user disconnects before joining any room
  socket.on('disconnect', () => {
    if (activeUsers[socket.id]) {
      console.log(`User disconnected before joining room: ${activeUsers[socket.id]}`);
      delete activeUsers[socket.id];
    }
  });
});

http.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
