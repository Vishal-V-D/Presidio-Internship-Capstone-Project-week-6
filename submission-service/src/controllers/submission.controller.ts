import { Request, Response } from "express";
import * as submissionService from "../services/submission.service";
import { SubmissionStatus } from "../entities/submission.entity";

/* ------------------ Create Submission ------------------ */
export const create = async (req: Request, res: Response) => {
  try {
    const { id, username, role } = (req as any).user;
    const { problemId, language, code, contestId } = req.body;

    // Validate required fields
    if (!problemId || !language || !code || !contestId) {
      return res.status(400).json({ 
        message: "Missing required fields",
        required: ["problemId", "language", "code", "contestId"]
      });
    }

    // Get auth token
    const token = req.headers.authorization || `Bearer ${req.cookies.token}`;
    if (!token) {
      return res.status(401).json({ message: "Authorization token missing" });
    }

    // Create submission
    const submission = await submissionService.createSubmission(
      id,
      username,
      role,
      problemId,
      language,
      code,
      contestId,
      token
    );

    res.status(201).json({
      id: submission.id,
      status: submission.status,
      message: "Submission created successfully. Processing..."
    });
  } catch (err: any) {
    console.error("🚨 [Controller] Submission creation failed:", err.message || err);
    res.status(err.status || 500).json({ 
      message: err.message || "Submission failed",
      error: err.response?.data || err.message 
    });
  }
};

/* ------------------ Get Submission by ID ------------------ */
export const get = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const submission = await submissionService.getSubmission(req.params.id);

    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    // Check permissions
    if (user.role === "CONTESTANT" && submission.userId !== user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // Base response
    const result: {
      id: string;
      userId: string;
      username: string;
      problemId: string;
      contestId?: string;
      language: string;
      status: SubmissionStatus;
      points: number;
      passedTests?: number;
      totalTests?: number;
      executionTime?: number;
      memoryUsed?: number;
      createdAt: Date;
      feedback?: string | null;
      code?: string;
      outputLog?: string | null;
      output?: string | null;
      testResults?: any;
    } = {
      id: submission.id,
      userId: submission.userId,
      username: submission.username,
      problemId: submission.problemId,
      contestId: submission.contestId,
      language: submission.language,
      status: submission.status,
      points: submission.points,
      passedTests: submission.passedTests,
      totalTests: submission.totalTests,
      executionTime: submission.executionTime,
      memoryUsed: submission.memoryUsed,
      createdAt: submission.createdAt,
      outputLog: submission.outputLog ?? null,
      output: submission.outputLog ?? null,
      testResults: submission.testResults ?? null,
    };

    // Include feedback for organizers
    if (user.role === "ORGANIZER" && user.id === submission.organizerId) {
      result.feedback = submission.feedback ?? null;
      result.code = submission.code;
    }

    // Include code for own submissions
    if (submission.userId === user.id) {
      result.code = submission.code;
      result.feedback = submission.feedback ?? null;
    }

    // Redact sandbox details for unauthorized viewers
    const canViewSandboxDetails =
      submission.userId === user.id ||
      (user.role === "ORGANIZER" && user.id === submission.organizerId) ||
      user.role === "ADMIN";

    if (!canViewSandboxDetails) {
      delete result.outputLog;
      delete result.output;
      delete result.testResults;
    }

    res.json(result);
  } catch (err: any) {
    console.error("🚨 [Controller] Get submission failed:", err.message);
    res.status(500).json({ message: "Failed to fetch submission" });
  }
};

/* ------------------ List Submissions (by user) ------------------ */
export const listByUser = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const filters = {
      language: req.query.language as string | undefined,
      status: req.query.status as string | undefined,
    };

    const data = await submissionService.listSubmissionsByUser(
      user.id,
      page,
      limit,
      filters
    );

    res.json(data);
  } catch (err: any) {
    console.error("🚨 [Controller] List by user failed:", err.message);
    res.status(500).json({ message: "Failed to fetch submissions" });
  }
};

/* ------------------ List Submissions (by problem) ------------------ */
export const listByProblem = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const problemId = req.params.problemId;

    if (!problemId) {
      return res.status(400).json({ message: "Problem ID required" });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const filters = {
      language: req.query.language as string | undefined,
      status: req.query.status as string | undefined,
    };

    const data = await submissionService.listSubmissionsByProblem(
      problemId,
      page,
      limit,
      filters
    );

    // Filter based on role
    const filtered = data.submissions.filter((s) =>
      user.role === "ORGANIZER" ? s.organizerId === user.id : s.userId === user.id
    );

    res.json({
      submissions: filtered,
      total: filtered.length,
      page: data.page,
      limit: data.limit,
    });
  } catch (err: any) {
    console.error("🚨 [Controller] List by problem failed:", err.message);
    res.status(500).json({ message: "Failed to fetch submissions" });
  }
};

/* ------------------ List All Submissions (ADMIN / ORGANIZER) ------------------ */
export const listAll = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (user.role !== "ADMIN" && user.role !== "ORGANIZER") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const filters = {
      language: req.query.language as string | undefined,
      status: req.query.status as string | undefined,
      username: req.query.username as string | undefined,
    };

    const data = await submissionService.listAllSubmissions(page, limit, filters);
    res.json(data);
  } catch (err: any) {
    console.error("🚨 [Controller] List all failed:", err.message);
    res.status(500).json({ message: "Failed to fetch submissions" });
  }
};

/* ------------------ Leaderboard ------------------ */
export const leaderboard = async (req: Request, res: Response) => {
  try {
    const contestId = req.params.contestId;

    if (!contestId) {
      return res.status(400).json({ message: "Contest ID required" });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const filters = {
      username: req.query.username as string | undefined,
      minPoints: req.query.minPoints ? parseInt(req.query.minPoints as string) : undefined,
      maxPoints: req.query.maxPoints ? parseInt(req.query.maxPoints as string) : undefined,
    };

    const data = await submissionService.getLeaderboardByContest(
      contestId,
      page,
      limit,
      filters
    );

    res.json(data);
  } catch (err: any) {
    console.error("🚨 [Controller] Leaderboard fetch failed:", err.message);
    res.status(500).json({ message: "Failed to fetch leaderboard" });
  }
};

/* ------------------ Edit Leaderboard Entry (Organizer Only) ------------------ */
export const editLeaderboardEntry = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (user.role !== "ORGANIZER") {
      return res.status(403).json({ message: "Only organizers can edit leaderboard" });
    }

    const { contestId, userId } = req.params;
    const { pointsAdjustment, reason } = req.body;

    if (!contestId || !userId) {
      return res.status(400).json({ message: "Contest ID and User ID required" });
    }

    if (pointsAdjustment === undefined) {
      return res.status(400).json({ 
        message: "pointsAdjustment is required",
        example: { pointsAdjustment: -5, reason: "Penalty for late submission" }
      });
    }

    const result = await submissionService.editLeaderboardEntry(
      contestId,
      userId,
      user.id,
      { pointsAdjustment, reason }
    );

    res.json(result);
  } catch (err: any) {
    console.error("🚨 [Controller] Edit leaderboard failed:", err.message);
    res.status(err.status || 500).json({ message: err.message });
  }
};

/* ------------------ Delete Leaderboard Entry (Organizer Only) ------------------ */
export const deleteLeaderboardEntry = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (user.role !== "ORGANIZER") {
      return res.status(403).json({ message: "Only organizers can delete from leaderboard" });
    }

    const { contestId, userId } = req.params;

    if (!contestId || !userId) {
      return res.status(400).json({ message: "Contest ID and User ID required" });
    }

    const result = await submissionService.deleteLeaderboardEntry(
      contestId,
      userId,
      user.id
    );

    res.json(result);
  } catch (err: any) {
    console.error("🚨 [Controller] Delete leaderboard entry failed:", err.message);
    res.status(err.status || 500).json({ message: err.message });
  }
};

/* ------------------ Organizer Dashboard Metrics ------------------ */
export const getDashboardMetrics = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (user.role !== "ORGANIZER" && user.role !== "ADMIN") {
      return res.status(403).json({ message: "Only organizers can access dashboard" });
    }

    const contestId = req.query.contestId as string | undefined;

    const metrics = await submissionService.getOrganizerDashboardMetrics(
      user.id,
      contestId
    );

    res.json({
      success: true,
      data: metrics,
      contestId: contestId || "all",
    });
  } catch (err: any) {
    console.error("🚨 [Controller] Dashboard metrics failed:", err.message);
    res.status(err.status || 500).json({ message: err.message });
  }
};