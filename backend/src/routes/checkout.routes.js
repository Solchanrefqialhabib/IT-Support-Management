import express from "express";
import {
  getCheckouts,
  getCheckoutById,
  createCheckout,
  deleteCheckout,
} from "../controllers/checkout.controller.js";
import authMiddleware, { adminOnly } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", getCheckouts);
router.get("/:id", getCheckoutById);
router.post("/", createCheckout);
router.delete("/:id", adminOnly, deleteCheckout);

export default router;