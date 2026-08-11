import express from "express";
import { 
  getVisits, 
  getVisitById, 
  createVisit, 
  updateVisit, 
  deleteVisit, 
  updateVisitStatus 
} from "../controllers/visit.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import upload from "../middleware/upload.middleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", getVisits);
router.get("/:id", getVisitById);

// Hanya IT_SUPPORT yang dapat melakukan aksi tulis/ubah/hapus data kunjungan
router.post("/", requireRole("IT_SUPPORT"), upload.fields([{ name: 'beforeImage', maxCount: 1 }, { name: 'afterImage', maxCount: 1 }]), createVisit);
router.put("/:id", requireRole("IT_SUPPORT"), upload.fields([{ name: 'beforeImage', maxCount: 1 }, { name: 'afterImage', maxCount: 1 }]), updateVisit);
router.patch("/:id/status", requireRole("IT_SUPPORT"), updateVisitStatus);
router.delete("/:id", requireRole("IT_SUPPORT"), deleteVisit);

export default router;