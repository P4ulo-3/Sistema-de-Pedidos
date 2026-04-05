import express from "express";
import {
  listUsers,
  createUser,
  resetPassword,
  deleteUser,
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
router.delete("/:id", authenticate, authorize("admin"), deleteUser);

export default router;
