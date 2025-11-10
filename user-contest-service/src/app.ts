import express from "express";
import helmet from "helmet";
import cors from "cors";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./docs/swagger";
import routes from "./routes";
import errorMiddleware from "./middleware/error.middleware";
import { requestLogger } from "./middleware/requestLogger";
import logger from "./utils/logger";

dotenv.config();

const app = express();

// 🔐 Security, CORS, and parsers
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:4000",
  "http://quantum-judge-alb-dev-233767472.us-east-1.elb.amazonaws.com:5000",
  "http://quantum-judge-alb-dev-233767472.us-east-1.elb.amazonaws.com:4000",
  "http://quantum-judge-alb-dev-233767472.us-east-1.elb.amazonaws.com:8000",
  "http://quantum-judge-frontend-dev.s3-website-us-east-1.amazonaws.com",
  "https://dk1cx0l60ut7o.cloudfront.net"
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Authorization"],
    credentials: true,
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// 🧠 Request Logger (logs all API hits)
app.use(requestLogger);


// 🧩 Routes
app.use("/", routes);

// ❌ Centralized Error Handling + Logging
app.use((err: any, req: any, res: any, next: any) => {
  logger.error(
    `${req.method} ${req.url} | ${err.message} | Stack: ${err.stack?.split("\n")[0]}`
  );
  errorMiddleware(err, req, res, next);
});

export default app;
