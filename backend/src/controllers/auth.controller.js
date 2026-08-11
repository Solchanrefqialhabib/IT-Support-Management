import prisma from "../config/prisma.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { normalizeRole, isValidRole } from "../utils/roles.js";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const register = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({
        success: false,
        message: "Request body tidak ditemukan",
      });
    }

    const { name, email, password, role } = req.body;
    const normalizedRole = normalizeRole(role);

    if (!name || !email || !password || !normalizedRole) {
      return res.status(400).json({
        success: false,
        message: "Nama, email, password, dan role wajib diisi",
      });
    }

    if (!emailPattern.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Format email tidak valid",
      });
    }

    if (!isValidRole(normalizedRole)) {
      return res.status(400).json({
        success: false,
        message: `Role tidak valid. Gunakan salah satu: ADMIN, IT_SUPPORT, SUPERVISOR`,
      });
    }

    const checkUser = await prisma.user.findUnique({
      where: { email },
    });

    if (checkUser) {
      return res.status(400).json({
        success: false,
        message: "Email sudah digunakan",
      });
    }

    const hashPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashPassword,
        role: normalizedRole,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Register berhasil",
      data: user,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const login = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({
        success: false,
        message: "Request body tidak ditemukan",
      });
    }

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email dan password wajib diisi",
      });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Email tidak ditemukan",
      });
    }

    const checkPassword = await bcrypt.compare(password, user.password);

    if (!checkPassword) {
      return res.status(400).json({
        success: false,
        message: "Password salah",
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: "JWT_SECRET belum dikonfigurasi",
      });
    }

    const role = normalizeRole(user.role);

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    const { password: _, ...userData } = user;
    userData.role = role;

    return res.json({
      success: true,
      token,
      user: userData,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const profile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: req.user.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User tidak ditemukan",
      });
    }

    return res.json({
      success: true,
      data: { ...user, role: normalizeRole(user.role) },
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
