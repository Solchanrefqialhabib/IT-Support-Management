import express from "express";
import {
  sendMessage,
  sendBulkMessage,
  sendVisitNotification,
  sendDailyReport
} from "../controllers/wa.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/send", sendMessage);
router.post("/broadcast", sendBulkMessage); 
router.post("/visit-notification", sendVisitNotification);
router.post("/daily-report", sendDailyReport);

export default router;