import prisma from "../config/prisma.js";
import bcrypt from "bcrypt";

export const getProfile = async (req, res) => {
  try {
    const userId = Number(req.user?.id || req.user?.userId);
    if (!userId || isNaN(userId)) {
      return res.status(400).json({ success: false, message: "ID pengguna tidak valid di dalam token." });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: "Pengguna tidak ditemukan." });
    }

    return res.json({ success: true, data: user });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = Number(req.user?.id || req.user?.userId);
    const { name, email, oldPassword, newPassword } = req.body;

    if (!userId || isNaN(userId)) {
      return res.status(400).json({ success: false, message: "ID pengguna tidak valid." });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ success: false, message: "Pengguna tidak ditemukan." });

    let updatedData = {};
    if (name) updatedData.name = name;
    if (email) {
      const checkEmail = await prisma.user.findUnique({ where: { email } });
      if (checkEmail && checkEmail.id !== userId) {
        return res.status(400).json({ success: false, message: "Email sudah digunakan." });
      }
      updatedData.email = email;
    }

    if (newPassword) {
      if (!oldPassword) {
        return res.status(400).json({ success: false, message: "Password lama wajib diisi untuk mengubah password." });
      }
      const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
      if (!isPasswordValid) {
        return res.status(400).json({ success: false, message: "Password lama tidak sesuai." });
      }
      updatedData.password = await bcrypt.hash(newPassword, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updatedData,
      select: { id: true, name: true, email: true, role: true, updatedAt: true }
    });

    return res.json({ success: true, message: "Profil berhasil diperbarui", data: updatedUser });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true },
      orderBy: { createdAt: "desc" },
    });
    return res.json({ success: true, data: users });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id: Number(id) },
      select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: "User tidak ditemukan" });
    }

    return res.json({ success: true, data: user });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: "Semua field wajib diisi" });
    }

    const checkUser = await prisma.user.findUnique({ where: { email } });
    if (checkUser) {
      return res.status(400).json({ success: false, message: "Email sudah digunakan" });
    }

    const hashPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hashPassword, role },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    return res.status(201).json({ success: true, message: "User berhasil dibuat", data: user });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, role } = req.body;

    const user = await prisma.user.findUnique({ where: { id: Number(id) } });
    if (!user) {
      return res.status(404).json({ success: false, message: "User tidak ditemukan" });
    }

    const data = {};
    if (name) data.name = name;
    if (email) {
      const checkEmail = await prisma.user.findUnique({ where: { email } });
      if (checkEmail && checkEmail.id !== Number(id)) {
        return res.status(400).json({ success: false, message: "Email sudah digunakan" });
      }
      data.email = email;
    }
    if (password) data.password = await bcrypt.hash(password, 10);
    if (role) data.role = role;

    const updatedUser = await prisma.user.update({
      where: { id: Number(id) },
      data,
      select: { id: true, name: true, email: true, role: true, updatedAt: true },
    });

    return res.json({ success: true, message: "User berhasil diupdate", data: updatedUser });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({ where: { id: Number(id) } });
    if (!user) {
      return res.status(404).json({ success: false, message: "User tidak ditemukan" });
    }

    await prisma.user.delete({ where: { id: Number(id) } });
    return res.json({ success: true, message: "User berhasil dihapus" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};