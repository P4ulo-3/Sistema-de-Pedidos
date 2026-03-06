import express from "express";
import {
  createOrder,
  listOrders,
  updateOrderStatus,
  updateOrder,
} from "../controllers/orderController.js";
import { authenticate, authorize } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(authenticate);

router.post("/", authorize("waiter", "admin"), createOrder);
router.get("/", authorize("waiter", "kitchen", "admin"), listOrders);
router.patch(
  "/:id/status",
  authorize("waiter", "kitchen", "admin"),
  updateOrderStatus,
);
// allow waiter/admin to edit pending orders
router.put("/:id", authorize("waiter", "admin"), updateOrder);

export default router;
