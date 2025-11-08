import "reflect-metadata";
import dotenv from "dotenv";
dotenv.config();

import { AppDataSource } from "./config/db";
import app from "./app";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./docs/swagger";
import http from "http";
import { initSocket } from "./utils/socket";  // ✅ Using helper here

const PORT = process.env.PORT || 5000;

// ✅ Create HTTP server from Express app
const server = http.createServer(app);

// ✅ Initialize Socket.IO via helper
const io = initSocket(server);

// ✅ DB + Swagger setup
AppDataSource.initialize()
  .then(() => {
    app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

    // Start combined HTTP + WebSocket server
    server.listen(PORT, () => {
      console.log(`✅ Submission Service running on port ${PORT}`);
      console.log(`📘 Swagger: http://localhost:${PORT}/api/docs`);
      console.log(`💓 Health: http://localhost:${PORT}/health`);
      console.log(`🛰️ WebSocket active on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("DB init error", err);
    process.exit(1);
  });

// ✅ Export for other services (like submission.service)
export { io };
