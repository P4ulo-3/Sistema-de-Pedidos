import express from "express";
import {
  listTables,
  createTable,
  updateTable,
  deleteTable,
} from "../controllers/tablesController.js";
import { authenticate, authorize } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(authenticate);

router.get("/", authorize("admin", "kitchen", "waiter"), listTables);
router.post("/", authorize("admin"), createTable);
router.put("/:id", authorize("admin"), updateTable);
router.delete("/:id", authorize("admin"), deleteTable);

export default router;
