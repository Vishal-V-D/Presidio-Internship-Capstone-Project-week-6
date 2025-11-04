import { Request, Response } from "express";
import * as contestService from "../services/contest.service";

export const createContest = async (req: Request, res: Response) => {
  const payload = req.body;
  const user = (req as any).user;
  const contest = await contestService.createContest(payload, user.id);
  res.status(201).json(contest);
};

export const listContests = async (req: Request, res: Response) => {
  const skip = Number(req.query.skip) || 0;
  const take = Number(req.query.take) || 20;
  const list = await contestService.listContests(skip, take);
  res.json(list);
};

export const getContest = async (req: Request, res: Response) => {
  const contest = await contestService.getContest(req.params.id);
  if (!contest) return res.status(404).json({ message: "Not found" });
  res.json(contest);
};

export const addProblemToContest = async (req: Request, res: Response) => {
  const { problemId } = req.body;
  const cp = await contestService.addProblemToContest(req.params.id, problemId);
  res.status(201).json(cp);
};

export const removeProblemFromContest = async (req: Request, res: Response) => {
  await contestService.removeProblemFromContest(req.params.cpId);
  res.status(204).send();
};
