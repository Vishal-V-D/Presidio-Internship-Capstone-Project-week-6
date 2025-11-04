import { Router } from "express";
import * as authCtrl from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.post("/signup/organizer", authCtrl.registerOrganizer);
router.post("/signup/contestant", authCtrl.registerContestant);
router.post("/login", authCtrl.login);
router.post("/logout", authCtrl.logout);
router.get("/me", authenticate, authCtrl.me);

export default router;
