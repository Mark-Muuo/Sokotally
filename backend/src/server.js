import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { Server } from 'socket.io';
import app from './app.js';

dotenv.config();

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/sokotally';

// Create HTTP server and Socket.IO instance
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

// Make io available to routes
app.set('io', io);

// Socket.IO connection handler
io.on('connection', (socket) => {
  socket.on('join-user-room', (userId) => {
    socket.join(`user:${userId}`);
  });
});

async function bootstrap() {
  try {
    await mongoose.connect(mongoUri);
    const port = process.env.PORT || 4000;
    httpServer.listen(port, () => {
      console.log(`Server running on port: ${port}`);
      console.log("Connected to MongoDB");
    });
  } catch (e) {
    console.error('Failed to start server:', e.message);
    process.exit(1);
  }
}

bootstrap();

export { io };
