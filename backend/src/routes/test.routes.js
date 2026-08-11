import express from "express";
import prisma from "../config/prisma.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const users = await prisma.user.findMany();

    res.json({
      success: true,
      total: users.length,
      data: users,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;