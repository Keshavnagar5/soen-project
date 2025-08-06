import 'dotenv/config';
import http from 'http';
import app from './app.js';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import projectModel from './models/project.model.js';
import { generateResult } from './services/ai.service.js';

const port = process.env.PORT || 3000;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

// Socket.io middleware for JWT and projectId verification
io.use(async (socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers.authorization?.split(' ')[1];

    const projectId = socket.handshake.query.projectId;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return next(new Error('Invalid projectId'));
    }

    socket.project = await projectModel.findById(projectId);

    if (!token) {
      return next(new Error('Authentication error'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded) {
      return next(new Error('Authentication error'));
    }

    socket.user = decoded;
    next();
  } catch (error) {
    next(error);
  }
});

// Socket.io connection logic
io.on('connection', (socket) => {
  socket.roomId = socket.project._id.toString();
  console.log('✅ User connected:', socket.user.email);

  socket.join(socket.roomId);

  socket.on('project-message', async (data) => {
    const message = data.message;

    const aiIsPresentInMessage = message.includes('@ai');

    // Broadcast to all except sender
    socket.broadcast.to(socket.roomId).emit('project-message', data);

    if (aiIsPresentInMessage) {
      const prompt = message.replace('@ai', '').trim();

      const result = await generateResult(prompt);

      if (result?.error) {
        io.to(socket.roomId).emit('project-message', {
          sender: { _id: 'ai', email: 'Gemini AI' },
          message: JSON.stringify({
            text: result.message || 'AI failed to generate a response.',
          }),
        });
      } else {
        io.to(socket.roomId).emit('project-message', {
          sender: { _id: 'ai', email: 'Gemini AI' },
          message: JSON.stringify({
            text: result.text,
          }),
        });
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('❌ User disconnected:', socket.user?.email || 'Unknown');
    socket.leave(socket.roomId);
  });
});

server.listen(port, () => {
  console.log(`🚀 Server is running on port ${port}`);
});
