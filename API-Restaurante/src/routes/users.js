import express from "express";
import {
  listUsers,
  createUser,
  resetPassword,
} from "../controllers/userController.js";
import { authenticate, authorize } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", authenticate, authorize("admin"), listUsers);
router.post("/", authenticate, authorize("admin"), createUser);
router.post(
  "/:id/reset-password",
  authenticate,
  authorize("admin"),
  resetPassword,
);

export default router;
