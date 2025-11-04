import { Request, Response } from "express";
import * as problemService from "../services/problem.service";

export const createProblem = async (req: Request, res: Response) => {
  const payload = req.body;
  const problem = await problemService.createProblem(payload);
  res.status(201).json(problem);
};

export const getProblem = async (req: Request, res: Response) => {
  const problem = await problemService.getProblem(req.params.id);
  if (!problem) return res.status(404).json({ message: "Not found" });
  res.json(problem);
};

export const listProblems = async (req: Request, res: Response) => {
  const skip = Number(req.query.skip) || 0;
  const take = Number(req.query.take) || 20;
  const list = await problemService.listProblems(skip, take);
  res.json(list);
};

export const addTestCase = async (req: Request, res: Response) => {
  const { input, expectedOutput, isHidden } = req.body;
  const tc = await problemService.addTestCase(req.params.id, input, expectedOutput, Boolean(isHidden));
  res.status(201).json(tc);
};
