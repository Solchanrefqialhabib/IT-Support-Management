import express from "express";
import {
  getBranches,
  getBranchById,
  createBranch,
  updateBranch,
  deleteBranch,
} from "../controllers/branch.controller.js";
import authMiddleware, { adminOnly } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", getBranches);
router.get("/:id", getBranchById);
router.post("/", adminOnly, createBranch);
router.put("/:id", adminOnly, updateBranch);
router.delete("/:id", adminOnly, deleteBranch);

export default router;