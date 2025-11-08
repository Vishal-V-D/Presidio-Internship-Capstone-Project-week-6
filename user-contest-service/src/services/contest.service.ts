import { AppDataSource } from "../config/db";
import { Contest } from "../entities/contest.entity";
import { ContestProblem } from "../entities/contestProblem.entity";
import { Problem } from "../entities/problem.entity";
import { User } from "../entities/user.entity";

const repo = () => AppDataSource.getRepository(Contest);
const cpRepo = () => AppDataSource.getRepository(ContestProblem);
const problemRepo = () => AppDataSource.getRepository(Problem);
const userRepo = () => AppDataSource.getRepository(User);

const toDate = (value?: string | Date) => {
  if (!value) return undefined;
  return value instanceof Date ? value : new Date(value);
};

const calculateDurationMinutes = (start?: string | Date, end?: string | Date) => {
  const startDate = toDate(start);
  const endDate = toDate(end);

  if (!startDate || !endDate) return undefined;

  const diffMs = endDate.getTime() - startDate.getTime();
  if (Number.isNaN(diffMs) || diffMs <= 0) return 0;

  return Math.round(diffMs / 60000);
};

/** 🧩 Create a contest (only organizers) */
export const createContest = async (data: any, creatorId: string) => {
  const creator = await userRepo().findOneBy({ id: creatorId });
  if (!creator) throw { status: 404, message: "Creator not found" };

  const contest = repo().create({
    title: data.title,
    description: data.description,
    startTime: toDate(data.startDate),  // ✅ map correctly
    endTime: toDate(data.endDate),      // ✅ map correctly
    durationMinutes:
      data.durationMinutes ??
      data.duration ??
      calculateDurationMinutes(data.startDate, data.endDate),
    createdBy: creator,
  });

  return await repo().save(contest);
};

/** 📋 List all contests (public view) */
export const listContests = async (skip = 0, take = 20) => {
  return await repo().find({
    skip,
    take,
    relations: ["createdBy", "contestProblems", "contestProblems.problem"],
    order: { startTime: "ASC" },
  });
};

/** 🔍 Get full contest details */
export const getContest = async (id: string) => {
  const contest = await repo().findOne({
    where: { id },
    relations: [
  "createdBy",
  "contestProblems",
  "contestProblems.problem",
  "contestant", // correct property name
],

  });

  if (!contest) throw { status: 404, message: "Contest not found" };
  return contest;
};

/** 🧠 Add a problem to a contest */
export const addProblemToContest = async (contestId: string, problemId: string) => {
  const contest = await repo().findOneBy({ id: contestId });
  const problem = await problemRepo().findOneBy({ id: problemId });

  if (!contest || !problem) throw { status: 404, message: "Contest or Problem not found" };

  const cp = cpRepo().create({ contest, problem });
  return await cpRepo().save(cp);
};

/** ❌ Remove problem from contest */
export const removeProblemFromContest = async (id: string) => {
  const cp = await cpRepo().findOneBy({ id });
  if (!cp) throw { status: 404, message: "Contest-Problem link not found" };
  return await cpRepo().remove(cp);
};

/** 🧍 Register contestant for a contest */
export const registerForContest = async (contestId: string, userId: string) => {
  const contest = await repo().findOne({
    where: { id: contestId },
    relations: ["contestant"],
  });
  const user = await userRepo().findOneBy({ id: userId });

  if (!contest || !user) throw { status: 404, message: "Contest or User not found" };

  // Prevent duplicate registration
  if (contest.contestant?.some((u) => u.id === user.id)) {
    throw { status: 400, message: "User already registered" };
  }

  contest.contestant.push(user);
  await repo().save(contest);
  return contest;
};

/** 📄 Get all contests created by the logged-in organizer */
export const getCreatedContestsByUser = async (userId: string) => {
  const user = await userRepo().findOne({
    where: { id: userId },
    relations: ["createdContests", "createdContests.contestProblems"],
  });
  if (!user) throw { status: 404, message: "User not found" };
  return user.createdContests || [];
};

/** 🏁 Get all contests a contestant has registered for */
export const getRegisteredContestsByUser = async (userId: string) => {
  const user = await userRepo().findOne({
    where: { id: userId },
    relations: ["registeredContests"],
  });
  if (!user) throw { status: 404, message: "User not found" };
  return user.registeredContests || [];
};

/** ✏️ Update contest (Organizer only) */
export const updateContest = async (contestId: string, userId: string, data: any) => {
  const contest = await repo().findOne({
    where: { id: contestId },
    relations: ["createdBy"],
  });

  if (!contest) throw { status: 404, message: "Contest not found" };
  if (contest.createdBy.id !== userId) throw { status: 403, message: "Not authorized" };

  // Update only allowed fields
  contest.title = data.title ?? contest.title;
  contest.description = data.description ?? contest.description;
  contest.startTime = toDate(data.startDate) ?? contest.startTime;
  contest.endTime = toDate(data.endDate) ?? contest.endTime;

  if (data.durationMinutes !== undefined || data.duration !== undefined) {
    contest.durationMinutes = data.durationMinutes ?? data.duration ?? contest.durationMinutes;
  } else if (contest.startTime && contest.endTime) {
    contest.durationMinutes = calculateDurationMinutes(contest.startTime, contest.endTime);
  }

  return await repo().save(contest);
};

/** ❌ Delete contest (Organizer only) */
export const deleteContest = async (contestId: string, userId: string) => {
  const contest = await repo().findOne({
    where: { id: contestId },
    relations: ["createdBy"],
  });

  if (!contest) throw { status: 404, message: "Contest not found" };
  if (contest.createdBy.id !== userId) throw { status: 403, message: "Not authorized" };

  return await repo().remove(contest);
};
