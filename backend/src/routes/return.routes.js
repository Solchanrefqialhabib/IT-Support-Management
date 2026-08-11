import express from "express";
import {
  getReturns,
  getReturnById,
  createReturn,
  updateReturnStatus,
  deleteReturn,
} from "../controllers/return.controller.js";
import authMiddleware, { adminOnly } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", getReturns);
router.get("/:id", getReturnById);
router.post("/", createReturn);
router.put("/:id/status", adminOnly, updateReturnStatus);
router.delete("/:id", adminOnly, deleteReturn);

export default router;