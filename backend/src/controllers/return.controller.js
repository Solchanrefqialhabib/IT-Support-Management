import prisma from "../config/prisma.js";

export const getReturns = async (req, res) => {
  try {
    const { startDate, endDate, itemId, branchId, status } = req.query;

    const where = {};
    if (itemId) where.itemId = Number(itemId);
    if (branchId) where.branchId = Number(branchId);
    if (status) where.status = status;
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const returns = await prisma.itemReturn.findMany({
      where,
      include: {
        item: { select: { id: true, itemName: true, itemCode: true } },
        branch: { select: { id: true, name: true } },
      },
      orderBy: { date: "desc" },
    });

    return res.json({
      success: true,
      data: returns,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getReturnById = async (req, res) => {
  try {
    const { id } = req.params;

    const returnData = await prisma.itemReturn.findUnique({
      where: { id: Number(id) },
      include: {
        item: {
          select: { id: true, itemName: true, itemCode: true, serialNumber: true },
        },
        branch: { select: { id: true, name: true, address: true } },
      },
    });

    if (!returnData) {
      return res.status(404).json({
        success: false,
        message: "Return tidak ditemukan",
      });
    }

    return res.json({
      success: true,
      data: returnData,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const createReturn = async (req, res) => {
  try {
    const { itemId, branchId, date, serialNumber, damage, status, quantity } = req.body;

    if (!itemId || !branchId || !date || !serialNumber || !damage) {
      return res.status(400).json({
        success: false,
        message: "Item, branch, date, serialNumber, damage wajib diisi",
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

    const returnQty = Number(quantity || 1);
    const finalStatus = status || "RUSAK";

    const returnData = await prisma.$transaction(async (tx) => {
      const newReturn = await tx.itemReturn.create({
        data: {
          itemId: Number(itemId),
          branchId: Number(branchId),
          date: new Date(date),
          serialNumber,
          damage,
          status: finalStatus,
        },
        include: {
          item: { select: { id: true, itemName: true } },
          branch: { select: { id: true, name: true } },
        },
      });

      // Jika status return adalah READY (artinya barang kembali ke stok gudang utama dalam keadaan baik)
      let updateData = { status: finalStatus };
      if (finalStatus === "READY") {
        updateData.stock = item.stock + returnQty;
      }

      await tx.item.update({
        where: { id: Number(itemId) },
        data: updateData,
      });

      return newReturn;
    });

    return res.status(201).json({
      success: true,
      message: "Return berhasil dicatat",
      data: returnData,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateReturnStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status wajib diisi",
      });
    }

    const returnData = await prisma.itemReturn.findUnique({
      where: { id: Number(id) },
      include: { item: true }
    });

    if (!returnData) {
      return res.status(404).json({
        success: false,
        message: "Return tidak ditemukan",
      });
    }

    const updatedReturn = await prisma.$transaction(async (tx) => {
      const updated = await tx.itemReturn.update({
        where: { id: Number(id) },
        data: { status },
        include: {
          item: { select: { id: true, itemName: true } },
          branch: { select: { id: true, name: true } },
        },
      });

      let itemUpdateData = { status };
      // Jika status berubah menjadi READY, tambahkan stok barang
      if (status === "READY" && returnData.status !== "READY") {
        itemUpdateData.stock = returnData.item.stock + 1; // Sesuaikan qty jika ada kolom quantity di itemReturn
      }

      await tx.item.update({
        where: { id: returnData.itemId },
        data: itemUpdateData,
      });

      return updated;
    });

    return res.json({
      success: true,
      message: "Status return berhasil diupdate",
      data: updatedReturn,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteReturn = async (req, res) => {
  try {
    const { id } = req.params;

    const returnData = await prisma.itemReturn.findUnique({
      where: { id: Number(id) },
      include: { item: true },
    });

    if (!returnData) {
      return res.status(404).json({
        success: false,
        message: "Return tidak ditemukan",
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.itemReturn.delete({
        where: { id: Number(id) },
      });

      // Jika sebelumnya status return sempat menambah stok (READY), kurangi kembali saat data retur dihapus
      if (returnData.status === "READY" && returnData.item) {
        await tx.item.update({
          where: { id: returnData.itemId },
          data: {
            stock: Math.max(0, returnData.item.stock - 1),
            status: "DIPAKAI",
          },
        });
      }
    });

    return res.json({
      success: true,
      message: "Return berhasil dihapus",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};