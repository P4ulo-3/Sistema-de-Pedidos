import express from "express";
import cors from "cors";
import morgan from "morgan";

import authRoutes from "./routes/auth.js";
import productRoutes from "./routes/products.js";
import orderRoutes from "./routes/orders.js";
import usersRoutes from "./routes/users.js";
import errorHandler from "./middlewares/errorHandler.js";

const app = express();

app.use(
  cors({
    origin: "https://sistema-de-pedidos-1.vercel.app",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  }),
);
app.use(morgan("dev"));
app.use(express.json());
// uploads served via Cloudinary; local static uploads no longer used

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.use("/auth", authRoutes);
app.use("/products", productRoutes);
app.use("/orders", orderRoutes);
app.use("/users", usersRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use(errorHandler);

export default app;
