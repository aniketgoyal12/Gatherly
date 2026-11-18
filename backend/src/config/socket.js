let io = null;

export const initSocket = (server) => {
  try {
    // Dynamically attempt to initialize socket.io if installed
    import('socket.io')
      .then(({ Server }) => {
        io = new Server(server, {
          cors: {
            origin: process.env.CLIENT_URL || 'http://localhost:5173',
            credentials: true,
          },
        });

        io.on('connection', (socket) => {
          console.log(`[Socket.IO] Connected client: ${socket.id}`);

          // Join event rooms (attendees or staff)
          socket.on('join_event', (eventId) => {
            socket.join(`event_${eventId}`);
          });

          socket.on('join_staff_event', (eventId) => {
            socket.join(`event_${eventId}_staff`);
          });

          socket.on('join_user', (userId) => {
            socket.join(`user_${userId}`);
          });

          socket.on('disconnect', () => {
            console.log(`[Socket.IO] Disconnected client: ${socket.id}`);
          });
        });

        console.log('[Socket.IO] Gateway initialized successfully');
      })
      .catch(() => {
        console.warn('[Socket.IO] socket.io package not installed yet. Running in fallback mode.');
      });
  } catch (err) {
    console.warn(`[Socket.IO] Initialization skipped: ${err.message}`);
  }
};

export const getIO = () => io;

/**
 * Emit an event to a specific room or client safely
 */
export const emitToRoom = (room, eventName, data) => {
  if (io) {
    io.to(room).emit(eventName, data);
  } else {
    // In-memory / console log fallback for dev
    console.log(`[Socket.IO Fallback] Emit to [${room}] - ${eventName}:`, data);
  }
};

export default {
  initSocket,
  getIO,
  emitToRoom,
};
