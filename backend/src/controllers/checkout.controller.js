import prisma from "../config/prisma.js";

export const getCheckouts = async (req, res) => {
  try {
    const { startDate, endDate, itemId, branchId } = req.query;

    const where = {};

    if (req.user.role !== "ADMIN") {
      where.userId = req.user.id;
    }
    if (itemId) where.itemId = Number(itemId);
    if (branchId) where.branchId = Number(branchId);
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const checkouts = await prisma.itemCheckout.findMany({
      where,
      include: {
        item: { select: { id: true, itemName: true, itemCode: true } },
        user: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true } },
      },
      orderBy: { date: "desc" },
    });

    return res.json({
      success: true,
      data: checkouts,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getCheckoutById = async (req, res) => {
  try {
    const { id } = req.params;

    const checkout = await prisma.itemCheckout.findUnique({
      where: { id: Number(id) },
      include: {
        item: { select: { id: true, itemName: true, itemCode: true, serialNumber: true } },
        user: { select: { id: true, name: true, email: true } },
        branch: { select: { id: true, name: true, address: true } },
      },
    });

    if (!checkout) {
      return res.status(404).json({
        success: false,
        message: "Checkout tidak ditemukan",
      });
    }

    return res.json({
      success: true,
      data: checkout,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const createCheckout = async (req, res) => {
  try {
    const { itemId, branchId, date, quantity, purpose } = req.body;

    if (!itemId || !branchId || !date || !quantity || !purpose) {
      return res.status(400).json({
        success: false,
        message: "Item, branch, date, quantity, purpose wajib diisi",
      });
    }

    const item = await prisma.item.findUnique({
      where: { id: Number(itemId) },
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Barang tidak ditemukan",
      });
    }

    const qty = Number(quantity);
    if (item.stock < qty) {
      return res.status(400).json({
        success: false,
        message: `Stok tidak mencukupi. Stok tersedia: ${item.stock}`,
      });
    }

    const checkout = await prisma.$transaction(async (tx) => {
      const newCheckout = await tx.itemCheckout.create({
        data: {
          itemId: Number(itemId),
          userId: req.user.id,
          branchId: Number(branchId),
          date: new Date(date),
          quantity: qty,
          notes: purpose,
        },
        include: {
          item: { select: { id: true, itemName: true } },
          branch: { select: { id: true, name: true } },
        },
      });

      await tx.item.update({
        where: { id: Number(itemId) },
        data: {
          stock: item.stock - qty,
          status: "DIPAKAI",
        },
      });

      return newCheckout;
    });

    return res.status(201).json({
      success: true,
      message: "Checkout berhasil",
      data: checkout,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteCheckout = async (req, res) => {
  try {
    const { id } = req.params;

    const checkout = await prisma.itemCheckout.findUnique({
      where: { id: Number(id) },
    });

    if (!checkout) {
      return res.status(404).json({
        success: false,
        message: "Checkout tidak ditemukan",
      });
    }

    await prisma.$transaction(async (tx) => {
      const item = await tx.item.findUnique({
        where: { id: checkout.itemId },
      });

      await tx.itemCheckout.delete({
        where: { id: Number(id) },
      });

      const restoredStock = (item?.stock || 0) + checkout.quantity;

      await tx.item.update({
        where: { id: checkout.itemId },
        data: {
          stock: restoredStock,
          // Ubah kembali status jadi READY jika stok kembali penuh atau sesuai kebutuhan
          status: restoredStock > 0 ? "READY" : item?.status,
        },
      });
    });

    return res.json({
      success: true,
      message: "Checkout berhasil dihapus",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};