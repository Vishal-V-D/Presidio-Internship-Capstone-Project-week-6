import { DataSource } from "typeorm";
import dotenv from "dotenv";
import { User } from "../entities/user.entity";
import { Problem } from "../entities/problem.entity";
import { TestCase } from "../entities/testcase.entity";
import { Contest } from "../entities/contest.entity";
import { ContestProblem } from "../entities/contestProblem.entity";

dotenv.config();

export const AppDataSource = new DataSource({
  type: "mysql",
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  synchronize: true,
  logging: false,
  entities: [User, Problem, TestCase, Contest, ContestProblem]
});
