import { DataSource } from "typeorm";
import dotenv from "dotenv";
dotenv.config();
import { Submission } from "../entities/submission.entity";

export const AppDataSource = new DataSource({
  type: "mysql",
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  synchronize: true,
  logging: false,
  entities: [Submission],
});
