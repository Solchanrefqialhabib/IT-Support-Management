import express from "express";
import {
  getItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
} from "../controllers/item.controller.js";
import authMiddleware, { requireRole } from "../middleware/auth.middleware.js";
import { ROLE_ADMIN, ROLE_IT_SUPPORT } from "../utils/roles.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", getItems);
router.get("/:id", getItemById);

// Menggunakan konstanta role agar konsisten dengan file auth.middleware.js
router.post("/", requireRole(ROLE_ADMIN), createItem);
router.put("/:id", requireRole(ROLE_ADMIN), updateItem);
router.delete("/:id", requireRole(ROLE_ADMIN), deleteItem);

export default router;