import http from 'http';
import app from './app.js';
import connectDB from './config/db.js';
import { initSocket } from './config/socket.js';

const PORT = process.env.PORT || 5000;

// Create HTTP server wrapping Express app
const server = http.createServer(app);

// Initialize Socket.IO gateway
initSocket(server);

// Start server after connecting to database
const startServer = async () => {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`[Gatherly Backend] Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    console.log(`[Gatherly Backend] Base API endpoint: http://localhost:${PORT}/api/v1`);
  });
};

startServer();

export default server;
