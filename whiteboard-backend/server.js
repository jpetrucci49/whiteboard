const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // allow frontend origin during dev
    methods: ["GET", "POST"]
  }
});

// Store user colors and cursor positions
const users = new Map(); // socket.id -> { color, cursor }

const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD', '#D4A5A5', '#9B59B6'];

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Assign a unique color to this user
  const userColor = colors[users.size % colors.length];
  users.set(socket.id, { color: userColor, cursor: null });

  // Send existing users' cursors to new user
  socket.emit('users', Array.from(users.entries()));

  // Broadcast new user to others
  socket.broadcast.emit('userJoined', { id: socket.id, color: userColor });

  // Listen for 'draw' events from any client
  socket.on('draw', (lineData) => {
    // Enforce sender's color (prevents cheating)
    const user = users.get(socket.id);
    if (user) {
      lineData.color = user.color;
      lineData.userId = socket.id;
      socket.broadcast.emit('draw', lineData);
    }
  });

  // Listen for color changes
  socket.on('colorChange', (color) => {
    const user = users.get(socket.id);
    if (user) {
      user.color = color;
      socket.broadcast.emit('colorChange', { id: socket.id, color });
    }
  });

  // Handle live cursor movement (throttled on client)
  socket.on('cursor', (position) => {
    const user = users.get(socket.id);
    if (user) {
      user.cursor = position;
      socket.broadcast.emit('cursor', { id: socket.id, position });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    users.delete(socket.id);
    socket.broadcast.emit('userLeft', socket.id);
  });

  socket.on('clear', () => {
    socket.broadcast.emit('clear');
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
