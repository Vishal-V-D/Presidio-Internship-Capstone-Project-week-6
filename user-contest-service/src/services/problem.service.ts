import { AppDataSource } from "../config/db";
import { Problem } from "../entities/problem.entity";
import { TestCase } from "../entities/testcase.entity";

const repo = () => AppDataSource.getRepository(Problem);
const tcRepo = () => AppDataSource.getRepository(TestCase);

export const createProblem = async (data: any) => {
  const p = repo().create(data);
  return await repo().save(p);
};

export const getProblem = async (id: string) =>
  repo().findOne({ where: { id }, relations: ["testcases"] });

export const listProblems = async (skip = 0, take = 20) =>
  repo().find({ skip, take });

export const addTestCase = async (problemId: string, input: string, expectedOutput: string, isHidden = false) => {
  const problem = await repo().findOneBy({ id: problemId });
  if (!problem) throw { status: 404, message: "Problem not found" };
  const tc = tcRepo().create({ input, expectedOutput, isHidden, problem });
  return await tcRepo().save(tc);
};
