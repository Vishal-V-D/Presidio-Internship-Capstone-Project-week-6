import { Server } from "socket.io";
import http from "http";

let io: Server;

// Hardcoded list of allowed origins
const ALLOWED_ORIGINS = [
  "http://localhost:8000",
  "http://localhost:4000",
  "http://quantum-judge-alb-dev-233767472.us-east-1.elb.amazonaws.com",
  "http://localhost:5173",
  "http://localhost:5000",
  "http://quantum-judge-alb-dev-233767472.us-east-1.elb.amazonaws.com:5000",
  "http://quantum-judge-alb-dev-233767472.us-east-1.elb.amazonaws.com:4000",
  "http://quantum-judge-alb-dev-233767472.us-east-1.elb.amazonaws.com:8000",
  "http://quantum-judge-frontend-dev.s3-website-us-east-1.amazonaws.com",
  "https://dk1cx0l60ut7o.cloudfront.net"
];

/**
 * Initialize the Socket.IO server.
 * Called once from server.ts after creating the HTTP server.
 */
export const initSocket = (server: http.Server): Server => {
  io = new Server(server, {
    cors: {
      origin: ALLOWED_ORIGINS,
      credentials: true,
    },
    transports: ["websocket", "polling"],
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
