import { Request, Response } from "express";
import * as contestService from "../services/contest.service";

/** 🧩 Create a contest */
export const createContest = async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    const user = (req as any).user;

    console.log("📥 [Controller] Create contest called");
    console.log("👤 User:", user);
    console.log("🧾 Payload:", payload);

    const contest = await contestService.createContest(payload, user.id);

    console.log("✅ Contest created successfully:", contest);
    res.status(201).json({ data: contest });
  } catch (err: any) {
    console.error("❌ [Controller] Error creating contest:", err);
    res.status(err.status || 500).json({ message: err.message || "Error creating contest" });
  }
};

/** 📋 List all contests */
export const listContests = async (req: Request, res: Response) => {
  try {
    const skip = Number(req.query.skip) || 0;
    const take = Number(req.query.take) || 20;
    const list = await contestService.listContests(skip, take);
    res.json(list);
  } catch (err: any) {
    res.status(err.status || 500).json({ message: err.message || "Error listing contests" });
  }
};

/** 🔍 Get single contest info */
export const getContest = async (req: Request, res: Response) => {
  console.log("Fetching contest ID:", req.params.id);
  try {
    const contest = await contestService.getContest(req.params.id);
    res.json(contest);
  } catch (err: any) {
    console.error("Contest fetch error:", err);
    res.status(err.status || 404).json({ message: err.message || "Contest not found" });
  }
};

/** ➕ Add problem to contest */
export const addProblemToContest = async (req: Request, res: Response) => {
  try {
    const { problemId } = req.body;
    const cp = await contestService.addProblemToContest(req.params.id, problemId);
    res.status(201).json(cp);
  } catch (err: any) {
    res.status(err.status || 500).json({ message: err.message || "Error adding problem" });
  }
};

/** ❌ Remove problem from contest */
export const removeProblemFromContest = async (req: Request, res: Response) => {
  try {
    await contestService.removeProblemFromContest(req.params.cpId);
    res.status(204).send();
  } catch (err: any) {
    res.status(err.status || 404).json({ message: err.message || "Error removing problem" });
  }
};

/** 🧍 Register current user for a contest */
export const registerForContest = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id: contestId } = req.params;

    const contest = await contestService.registerForContest(contestId, user.id);
    res.status(200).json({ message: "Successfully registered", contest });
  } catch (err: any) {
    res.status(err.status || 500).json({ message: err.message || "Registration failed" });
  }
};

/** 🧑‍💻 Get contests created by logged-in organizer */
export const getCreatedContests = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const contests = await contestService.getCreatedContestsByUser(user.id);
    res.json(contests);
  } catch (err: any) {
    res.status(err.status || 500).json({ message: err.message || "Error fetching created contests" });
  }
};

/** 🏁 Get contests registered by logged-in contestant */
export const getRegisteredContests = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const contests = await contestService.getRegisteredContestsByUser(user.id);
    res.json(contests);
  } catch (err: any) {
    res.status(err.status || 500).json({ message: err.message || "Error fetching registered contests" });
  }
};

/** ✏️ Update contest */
export const updateContest = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const data = req.body;

    const updatedContest = await contestService.updateContest(req.params.id, user.id, data);
    res.json({ message: "Contest updated successfully", data: updatedContest });
  } catch (err: any) {
    res.status(err.status || 500).json({ message: err.message || "Error updating contest" });
  }
};

/** ❌ Delete contest */
export const deleteContest = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    await contestService.deleteContest(req.params.id, user.id);
    res.status(204).send();
  } catch (err: any) {
    res.status(err.status || 500).json({ message: err.message || "Error deleting contest" });
  }
};
