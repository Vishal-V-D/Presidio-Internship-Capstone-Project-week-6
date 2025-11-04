import { AppDataSource } from "../config/db";
import { Contest } from "../entities/contest.entity";
import { ContestProblem } from "../entities/contestProblem.entity";
import { Problem } from "../entities/problem.entity";
import { User } from "../entities/user.entity";

const repo = () => AppDataSource.getRepository(Contest);
const cpRepo = () => AppDataSource.getRepository(ContestProblem);
const problemRepo = () => AppDataSource.getRepository(Problem);
const userRepo = () => AppDataSource.getRepository(User);

export const createContest = async (data: any, creatorId: string) => {
  const creator = await userRepo().findOneBy({ id: creatorId });
  if (!creator) throw { status: 404, message: "Creator not found" };
  const c = repo().create({ ...data, createdBy: creator });
  return await repo().save(c);
};

export const listContests = async (skip = 0, take = 20) =>
  repo().find({ skip, take, relations: ["contestProblems", "contestProblems.problem"] });

export const getContest = async (id: string) =>
  repo().findOne({ where: { id }, relations: ["contestProblems", "contestProblems.problem"] });

export const addProblemToContest = async (contestId: string, problemId: string) => {
  const contest = await repo().findOneBy({ id: contestId });
  const problem = await problemRepo().findOneBy({ id: problemId });
  if (!contest || !problem) throw { status: 404, message: "Contest or Problem not found" };
  const cp = cpRepo().create({ contest, problem });
  return await cpRepo().save(cp);
};

export const removeProblemFromContest = async (id: string) => {
  const cp = await cpRepo().findOneBy({ id });
  if (!cp) throw { status: 404, message: "Not found" };
  return await cpRepo().remove(cp);
};
