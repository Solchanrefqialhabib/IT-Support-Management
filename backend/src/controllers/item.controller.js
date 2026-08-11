import prisma from "../config/prisma.js";

export const getItems = async (req, res) => {
  try {
    const { category, status, search } = req.query;

    const where = {};
    if (category) where.category = category;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { itemName: { contains: search } },
        { itemCode: { contains: search } },
        { serialNumber: { contains: search } },
      ];
    }

    const items = await prisma.item.findMany({
      where,
      orderBy: { itemName: "asc" },
    });

    return res.json({
      success: true,
      data: items,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getItemById = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await prisma.item.findUnique({
      where: { id: Number(id) },
      include: {
        checkouts: {
          include: {
            user: { select: { id: true, name: true } },
            branch: { select: { id: true, name: true } },
          },
          orderBy: { date: "desc" },
          take: 10,
        },
        returns: {
          include: {
            branch: { select: { id: true, name: true } },
          },
          orderBy: { date: "desc" },
          take: 10,
        },
      },
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Barang tidak ditemukan",
      });
    }

    return res.json({
      success: true,
      data: item,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const createItem = async (req, res) => {
  try {
    const { itemCode, serialNumber, itemName, category, stock, status } = req.body;

    if (!itemCode || !itemName || !category || stock === undefined) {
      return res.status(400).json({
        success: false,
        message: "Item code, name, category, stock wajib diisi",
      });
    }

    const checkCode = await prisma.item.findUnique({
      where: { itemCode },
    });

    if (checkCode) {
      return res.status(400).json({
        success: false,
        message: "Kode barang sudah digunakan",
      });
    }

    if (serialNumber) {
      const checkSN = await prisma.item.findUnique({
        where: { serialNumber },
      });
      if (checkSN) {
        return res.status(400).json({
          success: false,
          message: "Serial number sudah digunakan",
        });
      }
    }

    const itemStatus = status || "READY";
    const finalStock = Number(stock); // Langsung ambil angka yang diinput

    const item = await prisma.item.create({
      data: {
        itemCode,
        serialNumber: serialNumber || null,
        itemName,
        category,
        stock: finalStock,
        status: itemStatus,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Barang berhasil dibuat",
      data: item,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { itemCode, serialNumber, itemName, category, status, stock } = req.body;

    const item = await prisma.item.findUnique({
      where: { id: Number(id) },
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Barang tidak ditemukan",
      });
    }

    // Validasi duplikasi itemCode
    if (itemCode && itemCode !== item.itemCode) {
      const checkCode = await prisma.item.findUnique({ where: { itemCode } });
      if (checkCode) {
        return res.status(400).json({ success: false, message: "Kode barang sudah digunakan" });
      }
    }

    // Validasi duplikasi serialNumber
    if (serialNumber !== undefined && serialNumber !== item.serialNumber && serialNumber !== "") {
      const checkSN = await prisma.item.findUnique({ where: { serialNumber } });
      if (checkSN) {
        return res.status(400).json({ success: false, message: "Serial number sudah digunakan" });
      }
    }

    const newStatus = status !== undefined ? status : item.status;
    const finalStock = stock !== undefined ? Number(stock) : item.stock; // Bebas pakai angka berapapun

    const updatedItem = await prisma.item.update({
      where: { id: Number(id) },
      data: {
        itemCode: itemCode || item.itemCode,
        serialNumber: serialNumber !== undefined ? (serialNumber || null) : item.serialNumber,
        itemName: itemName || item.itemName,
        category: category || item.category,
        status: newStatus,
        stock: finalStock, 
      },
    });

    return res.json({
      success: true,
      message: "Barang berhasil diupdate",
      data: updatedItem,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteItem = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await prisma.item.findUnique({
      where: { id: Number(id) },
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Barang tidak ditemukan",
      });
    }

    await prisma.item.delete({
      where: { id: Number(id) },
    });

    return res.json({
      success: true,
      message: "Barang berhasil dihapus",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};