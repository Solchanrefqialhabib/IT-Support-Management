import prisma from "../config/prisma.js";
import { calculateAllowance } from "../services/allowance.service.js";

export const getBranches = async (req, res) => {
  try {
    const branches = await prisma.branch.findMany({
      orderBy: { name: "asc" },
    });

    return res.json({
      success: true,
      data: branches,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getBranchById = async (req, res) => {
  try {
    const { id } = req.params;

    const branch = await prisma.branch.findUnique({
      where: { id: Number(id) },
    });

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Cabang tidak ditemukan",
      });
    }

    return res.json({
      success: true,
      data: branch,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const createBranch = async (req, res) => {
  try {
    const { name, address, allowance } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Nama cabang wajib diisi",
      });
    }

    const branch = await prisma.branch.create({
      data: {
        name,
        address: address || null,
        allowance: allowance === undefined ? calculateAllowance(name, address) : Number(allowance),
      },
    });

    return res.status(201).json({
      success: true,
      message: "Cabang berhasil dibuat",
      data: branch,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateBranch = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, allowance } = req.body;

    const branch = await prisma.branch.findUnique({
      where: { id: Number(id) },
    });

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Cabang tidak ditemukan",
      });
    }

    const data = {};
    if (name) data.name = name;
    if (address !== undefined) data.address = address;
    if (allowance !== undefined) data.allowance = Number(allowance);

    const updatedBranch = await prisma.branch.update({
      where: { id: Number(id) },
      data,
    });

    return res.json({
      success: true,
      message: "Cabang berhasil diupdate",
      data: updatedBranch,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteBranch = async (req, res) => {
  try {
    const { id } = req.params;

    const branch = await prisma.branch.findUnique({
      where: { id: Number(id) },
    });

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Cabang tidak ditemukan",
      });
    }

    await prisma.branch.delete({
      where: { id: Number(id) },
    });

    return res.json({
      success: true,
      message: "Cabang berhasil dihapus",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
