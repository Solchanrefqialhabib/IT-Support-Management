import express from "express";
import {
  getDashboard,
  getVisitStats,
  getVisitDailyTrend,
  getVisitFilteredTrend, 
  getTopTechnicians,
} from "../controllers/dashboard.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", getDashboard);
router.get("/visits", getVisitStats);
router.get("/trend", getVisitDailyTrend);
router.get("/trend-filter", getVisitFilteredTrend); // <-- Ini rute rahasia yang sebelumnya hilang
router.get("/top-technicians", getTopTechnicians);

export default router;