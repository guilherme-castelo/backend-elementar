const { Server } = require('socket.io');

let io;

/**
 * Initialize Socket.IO
 * @param {Object} httpServer - The HTTP server instance
 * @param {Object} options - Socket.IO options
 */
const init = (httpServer, options = {}) => {
  io = new Server(httpServer, {
    cors: {
      origin: "*", // Adjust for production
      methods: ["GET", "POST"]
    },
    ...options
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join a room based on user ID (sent from client)
    socket.on('join', (userId) => {
      if (userId) {
        socket.join(userId.toString());
        console.log(`Socket ${socket.id} joined room ${userId}`);
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  return io;
};

/**
 * Get the initialized Socket.IO instance
 * @returns {Object} io instance
 */
const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized!');
  }
  return io;
};

module.exports = { init, getIO };
