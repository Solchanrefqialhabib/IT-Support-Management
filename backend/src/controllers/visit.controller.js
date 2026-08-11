import prisma from "../config/prisma.js";
import { calculateAllowance } from "../services/allowance.service.js";
import { sendWAMessage } from "../services/wa.service.js";

export const getVisits = async (req, res) => {
  try {
    const { startDate, endDate, status, userId, branchId } = req.query;
    const where = {};

    if (req.user.role !== "ADMIN" && req.user.role !== "SUPERVISOR") {
      where.userId = req.user.id;
    }
    if (userId) where.userId = Number(userId);
    if (branchId) where.branchId = Number(branchId);
    if (status) where.status = status;
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const visits = await prisma.visit.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        branch: { select: { id: true, name: true, address: true } },
      },
      orderBy: { date: "desc" },
    });

    return res.json({ success: true, data: visits });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getVisitById = async (req, res) => {
  try {
    const { id } = req.params;
    const visit = await prisma.visit.findUnique({
      where: { id: Number(id) },
      include: {
        user: { select: { id: true, name: true, email: true } },
        branch: { select: { id: true, name: true, address: true } },
      },
    });

    if (!visit) {
      return res.status(404).json({ success: false, message: "Kunjungan tidak ditemukan" });
    }

    return res.json({ success: true, data: visit });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createVisit = async (req, res) => {
  try {
    if (req.user.role === "ADMIN" || req.user.role === "SUPERVISOR") {
      return res.status(403).json({
        success: false,
        message: "Akun Administrator / Supervisor hanya sebagai pemantau dan tidak diizinkan mencatat kunjungan lapangan."
      });
    }

    const {
      branchId,
      date,
      category,
      startTime,
      endTime,
      status,
      solution,
      beforeCondition,
    } = req.body;

    if (!branchId || !date || !category || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: "Branch, date, category, startTime, endTime wajib diisi",
      });
    }

    const primaryBranchId = Array.isArray(branchId) ? Number(branchId[0]) : Number(branchId);

    const branch = await prisma.branch.findUnique({ where: { id: primaryBranchId } });
    if (!branch) {
      return res.status(404).json({ success: false, message: "Cabang tidak ditemukan", data: null });
    }

    const beforeImage = req.files?.beforeImage ? `/uploads/${req.files.beforeImage[0].filename}` : null;
    const afterImage = req.files?.afterImage ? `/uploads/${req.files.afterImage[0].filename}` : null;

    const visit = await prisma.visit.create({
      data: {
        userId: req.user.id,
        branchId: primaryBranchId,
        date: new Date(date),
        category,
        startTime,
        endTime,
        status: status || "PENDING",
        solution: solution || null,
        beforeCondition: beforeCondition || null,
        beforeImage,
        afterImage,
        allowance: branch.allowance || calculateAllowance(branch.name, branch.address),
      },
      include: {
        user: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true } },
      },
    });

    // PERBAIKAN WA: Pastikan pengiriman pesan tidak memblokir respon sukses jika nomor WA belum diset
    const targetNumber = process.env.WA_GROUP_NUMBER || process.env.WA_TARGET_NUMBER;
    if (targetNumber) {
      const message = `🔔 *LAPORAN KUNJUNGAN BARU*\n\n` +
        `👤 Teknisi: ${visit.user?.name}\n` +
        `🏢 Cabang: ${visit.branch?.name}\n` +
        `📌 Kategori: ${visit.category}\n` +
        `📊 Status: ${visit.status}\n` +
        `⏰ Waktu: ${startTime} - ${endTime}`;
      
      await sendWAMessage(targetNumber, message).catch(err => console.error("Gagal kirim WA:", err));
    }

    return res.status(201).json({
      success: true,
      message: "Kunjungan berhasil dibuat",
      data: visit,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateVisit = async (req, res) => {
  try {
    const { id } = req.params;
    const { branchId, date, category, startTime, endTime, status, solution, beforeCondition, allowance } = req.body;

    const visit = await prisma.visit.findUnique({ where: { id: Number(id) } });
    if (!visit) {
      return res.status(404).json({ success: false, message: "Kunjungan tidak ditemukan" });
    }

    if (req.user.role !== "ADMIN" && visit.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: "Akses ditolak" });
    }

    const data = {};
    if (branchId) {
      const newBranchId = Number(branchId);
      const branch = await prisma.branch.findUnique({ where: { id: newBranchId } });
      if (branch) {
        data.branch = { connect: { id: newBranchId } };
        data.allowance = branch.allowance || calculateAllowance(branch.name, branch.address);
      }
    }

    if (date) data.date = new Date(date);
    if (category) data.category = category;
    if (startTime) data.startTime = startTime;
    if (endTime) data.endTime = endTime;
    if (status) data.status = status;
    if (solution !== undefined) data.solution = solution;
    if (beforeCondition !== undefined) data.beforeCondition = beforeCondition;
    if (allowance !== undefined && !branchId) data.allowance = Number(allowance);

    if (req.files?.beforeImage) data.beforeImage = `/uploads/${req.files.beforeImage[0].filename}`;
    if (req.files?.afterImage) data.afterImage = `/uploads/${req.files.afterImage[0].filename}`;

    const updatedVisit = await prisma.visit.update({
      where: { id: Number(id) },
      data,
      include: {
        user: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true } },
      },
    });

    return res.json({ success: true, message: "Kunjungan berhasil diupdate", data: updatedVisit });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteVisit = async (req, res) => {
  try {
    const { id } = req.params;
    const visit = await prisma.visit.findUnique({ where: { id: Number(id) } });

    if (!visit) {
      return res.status(404).json({ success: false, message: "Kunjungan tidak ditemukan" });
    }

    if (req.user.role !== "ADMIN" && visit.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: "Akses ditolak" });
    }

    await prisma.visit.delete({ where: { id: Number(id) } });

    return res.json({ success: true, message: "Kunjungan berhasil dihapus" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateVisitStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, solution, beforeCondition } = req.body || {};

    if (!status) {
      return res.status(400).json({ success: false, message: "Status wajib diisi" });
    }

    const visit = await prisma.visit.findUnique({ where: { id: Number(id) } });
    if (!visit) {
      return res.status(404).json({ success: false, message: "Kunjungan tidak ditemukan" });
    }

    const data = { status };
    if (solution !== undefined) data.solution = solution;
    if (beforeCondition !== undefined) data.beforeCondition = beforeCondition;

    const updatedVisit = await prisma.visit.update({
      where: { id: Number(id) },
      data,
      include: {
        user: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true } },
      },
    });

    return res.json({ success: true, message: "Status kunjungan berhasil diupdate", data: updatedVisit });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};