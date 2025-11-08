import { Request, Response } from "express";
import * as problemService from "../services/problem.service";

// ✅ Create Problem (Organizer Only)
export const createProblem = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const payload = req.body;
    const problem = await problemService.createProblem(payload, user.id);
    res.status(201).json(problem);
  } catch (err: any) {
    res.status(err.status || 500).json({ message: err.message || "Server error" });
  }
};

// ✅ Get Single Problem
export const getProblem = async (req: Request, res: Response) => {
  console.log("📌 [GET_PROBLEM] Incoming request...");

  try {
    const user = (req as any).user;
    const problemId = req.params.id;

    console.log("🔹 User:", user?.id || "No user");
    console.log("🔹 Problem ID:", problemId);

    // ✅ Call service, userId is optional (undefined for guests)
    const problem = await problemService.getProblem(problemId, user?.id);

    console.log("✅ [GET_PROBLEM] Problem data fetched successfully:");
    console.log(JSON.stringify(problem, null, 2));

    return res.json(problem);

  } catch (err: any) {
    console.error("❌ [GET_PROBLEM] Error occurred:", err);
    return res.status(err.status || 500).json({
      message: err.message || "Server error",
      error: err,
    });
  }
};

// ✅ List Problems
export const listProblems = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const skip = Number(req.query.skip) || 0;
    const take = Number(req.query.take) || 20;

    console.log("📥 [Controller] listProblems called:");
    console.log("   ➤ Authenticated user:", user ? `${user.id} (${user.role})` : "No user");
    console.log("   ➤ Query Params => skip:", skip, "| take:", take);

    const list = await problemService.listProblems(user?.id, skip, take);

    console.log(`✅ [Controller] listProblems fetched ${list.length} problems`);
    res.json(list);
  } catch (err: any) {
    console.error("❌ [Controller] Error listing problems:", err.message);
    res
      .status(err.status || 500)
      .json({ message: err.message || "Server error" });
  }
};

// ✅ Add Test Case
export const addTestCase = async (req: Request, res: Response) => {
  try {
    const { input, expectedOutput, isHidden } = req.body;
    const tc = await problemService.addTestCase(
      req.params.id,
      input,
      expectedOutput,
      Boolean(isHidden)
    );
    res.status(201).json(tc);
  } catch (err: any) {
    res.status(err.status || 500).json({ message: err.message || "Server error" });
  }
};

// ✅ Update Problem
export const updateProblem = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const updated = await problemService.updateProblem(req.params.id, user.id, req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(err.status || 500).json({ message: err.message || "Server error" });
  }
};

// ✅ Delete Problem
export const deleteProblem = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const result = await problemService.deleteProblem(req.params.id, user.id);
    res.json(result);
  } catch (err: any) {
    res.status(err.status || 500).json({ message: err.message || "Server error" });
  }
};
