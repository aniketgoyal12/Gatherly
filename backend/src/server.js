import http from 'http';
import app from './app.js';
import connectDB from './config/db.js';
import { initSocket } from './config/socket.js';
import { initRedis } from './config/redis.js';
import { startReservationCleanupJob } from './jobs/reservationCleanupQueue.js';
import { startEventReminderJob } from './jobs/eventReminderQueue.js';

const PORT = process.env.PORT || 5000;

// Create HTTP server wrapping Express app
const server = http.createServer(app);

// Initialize Socket.IO gateway
initSocket(server);

// Start server after connecting to database and initiating background jobs
const startServer = async () => {
  await connectDB();
  await initRedis();

  // Launch background queues & scheduled workers (ADR-005)
  startReservationCleanupJob();
  startEventReminderJob();

  server.listen(PORT, () => {
    console.log(`[Gatherly Backend] Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    console.log(`[Gatherly Backend] Base API endpoint: http://localhost:${PORT}/api/v1`);
  });
};

startServer();

export default server;
