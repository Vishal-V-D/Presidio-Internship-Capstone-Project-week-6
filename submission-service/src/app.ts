import express from "express";
import helmet from "helmet";
import cors from "cors";
import dotenv from "dotenv";
import routes from "./routes";
import { requestLogger } from "./middleware/requestLogger";
import errorMiddleware from "./middleware/error.middleware";
dotenv.config();

const app = express();

app.use(helmet());

// CORS configuration
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5000",
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
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Authorization"]
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

app.use("/", routes);

app.use(errorMiddleware);

export default app;
