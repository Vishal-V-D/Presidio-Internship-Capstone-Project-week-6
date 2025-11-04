import { Router } from "express";
import * as contestCtrl from "../controllers/contest.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/role.middleware";

const router = Router();

router.post("/", authenticate, authorize("ORGANIZER"), contestCtrl.createContest);
router.get("/", contestCtrl.listContests);
router.get("/:id", contestCtrl.getContest);
router.post("/:id/problems", authenticate, authorize("ORGANIZER"), contestCtrl.addProblemToContest);
router.delete("/problems/:cpId", authenticate, authorize("ORGANIZER"), contestCtrl.removeProblemFromContest);

export default router;
