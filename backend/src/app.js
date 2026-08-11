import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import branchRoutes from "./routes/branch.routes.js";
import visitRoutes from "./routes/visit.routes.js";
import itemRoutes from "./routes/item.routes.js";
import checkoutRoutes from "./routes/checkout.routes.js";
import returnRoutes from "./routes/return.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import reportRoutes from "./routes/report.routes.js";
import waRoutes from "./routes/wa.routes.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.json({ message: "IT Support Management API", version: "1.0.0" });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/branches", branchRoutes);
app.use("/api/visits", visitRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/checkouts", checkoutRoutes);
app.use("/api/returns", returnRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/reports", reportRoutes);
// Didaftarkan sebagai /api/wa agar sinkron dengan frontend
app.use("/api/wa", waRoutes); 

export default app;