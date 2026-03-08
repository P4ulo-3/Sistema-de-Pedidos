import express from "express";
import multer from "multer";

import {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";
import { authenticate, authorize } from "../middlewares/authMiddleware.js";

// use memory storage and upload to Cloudinary in controllers
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

const router = express.Router();

router.get("/", listProducts);
router.get("/:id", getProductById);
router.post(
  "/",
  authenticate,
  authorize("admin"),
  upload.single("image"),
  createProduct,
);
router.put(
  "/:id",
  authenticate,
  authorize("admin"),
  upload.single("image"),
  updateProduct,
);
router.delete("/:id", authenticate, authorize("admin"), deleteProduct);

export default router;
