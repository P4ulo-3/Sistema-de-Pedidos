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

const storage = multer.diskStorage({
  destination: "src/uploads",
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}-${file.originalname.replace(/\s+/g, "-")}`);
  },
});

const upload = multer({ storage });

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
