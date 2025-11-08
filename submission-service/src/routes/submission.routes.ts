import { Router } from "express";
import * as ctrl from "../controllers/submission.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/role.middleware";

const router = Router();

// ==================== SUBMISSION ROUTES ====================

// Create new submission (authenticated users)
router.post("/", authenticate, ctrl.create);

// Get single submission by ID
router.get("/:id", authenticate, ctrl.get);

// Get current user's submissions
router.get("/user/me", authenticate, ctrl.listByUser);

// Get submissions for a specific problem
router.get("/problem/:problemId", authenticate, ctrl.listByProblem);

// List all submissions (Admin/Organizer only)
router.get("/", authenticate, authorize("ADMIN", "ORGANIZER"), ctrl.listAll);

// ==================== LEADERBOARD ROUTES ====================

// Get leaderboard for a contest (public - anyone can view)
router.get("/leaderboard/:contestId", ctrl.leaderboard);

// ✅ NEW: Edit leaderboard entry (Organizer only)
router.patch(
  "/leaderboard/:contestId/user/:userId",
  authenticate,
  authorize("ORGANIZER"),
  ctrl.editLeaderboardEntry
);

// ✅ NEW: Delete user from leaderboard (Organizer only)
router.delete(
  "/leaderboard/:contestId/user/:userId",
  authenticate,
  authorize("ORGANIZER"),
  ctrl.deleteLeaderboardEntry
);

// ==================== DASHBOARD ROUTES ====================

// ✅ NEW: Get organizer dashboard metrics (Organizer/Admin only)
router.get(
  "/dashboard/metrics",
  authenticate,
  authorize("ORGANIZER", "ADMIN"),
  ctrl.getDashboardMetrics
);

export default router;