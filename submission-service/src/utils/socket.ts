import { Server } from "socket.io";
import http from "http";

let io: Server;

/**
 * Initialize the Socket.IO server.
 * Called once from server.ts after creating the HTTP server.
 */
export const initSocket = (server: http.Server): Server => {
  io = new Server(server, {
    cors: {
      origin: ["http://localhost:3000", "http://localhost:4000"], // frontend + user/contest service
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log(`⚡ [Socket] Connected: ${socket.id}`);

    socket.on("disconnect", () => {
      console.log(`❌ [Socket] Disconnected: ${socket.id}`);
    });
  });

  return io;
};

/**
 * Get the current Socket.IO instance
 * (use this in your services or controllers).
 */
export const getIO = (): Server => {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
};

/**
 * Emit live submission update to all connected clients
 */
export const emitSubmissionUpdate = (submissionId: string, data: any) => {
  if (!io) return;
  io.emit("submissionUpdate", { submissionId, ...data });
};

/**
 * Emit leaderboard update to all connected clients
 */
export const emitLeaderboardUpdate = (contestId: string, data: any) => {
  if (!io) return;
  io.emit("leaderboardUpdate", { contestId, ...data });
};
