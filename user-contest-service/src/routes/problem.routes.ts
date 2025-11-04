import { Router } from "express";
import * as problemCtrl from "../controllers/problem.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/role.middleware";

const router = Router();

router.post("/", authenticate, authorize("ORGANIZER"), problemCtrl.createProblem);
router.get("/", problemCtrl.listProblems);
router.get("/:id", problemCtrl.getProblem);
router.post("/:id/testcases", authenticate, authorize("ORGANIZER"), problemCtrl.addTestCase);

export default router;
