import express from "express";
import {
  financeSummary,
  financeWaiters,
} from "../controllers/financeController.js";
import { authenticate, authorize } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(authenticate, authorize("admin"));

router.get("/summary", financeSummary);
router.get("/waiters", financeWaiters);

export default router;
