import { Router } from "express";
import submissionRoutes from "./submission.routes";
import { health } from "../controllers/health.controller";

const router = Router();

router.get("/health", health);
router.use("/api/submissions", submissionRoutes);

export default router;
