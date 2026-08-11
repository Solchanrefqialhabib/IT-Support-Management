import prisma from "../config/prisma.js";

// Ambil riwayat inventaris masuk & keluar
export const getInventoryHistory = async (req, res) => {
  try {
    const checkouts = await prisma.itemCheckout.findMany({
      include: {
        item: { select: { id: true, itemName: true, itemCode: true } },
        user: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json({
      success: true,
      data: checkouts,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Proses Barang Keluar (Check-out / Peminjaman / Penugasan Cabang)
export const checkoutItem = async (req, res) => {
  try {
    const { itemId, branchId, quantity, notes } = req.body;
    const userId = Number(req.user?.id || req.user?.userId);

    if (!itemId || !branchId || !quantity) {
      return res.status(400).json({ success: false, message: "Item, Cabang, dan Jumlah wajib diisi." });
    }

    const item = await prisma.item.findUnique({ where: { id: Number(itemId) } });
    if (!item) {
      return res.status(404).json({ success: false, message: "Barang inventaris tidak ditemukan." });
    }

    if (item.stock < Number(quantity)) {
      return res.status(400).json({ success: false, message: `Stok tidak mencukupi. Sisa stok: ${item.stock}` });
    }

    // Kurangi stok utama dan catat transaksi checkout secara bersamaan (Transaction)
    const [checkoutRecord] = await prisma.$transaction([
      prisma.itemCheckout.create({
        data: {
          itemId: Number(itemId),
          userId,
          branchId: Number(branchId),
          quantity: Number(quantity),
          status: "DIPINJAM",
          notes,
        },
        include: { item: true, branch: true, user: true }
      }),
      prisma.item.update({
        where: { id: Number(itemId) },
        data: { stock: { decrement: Number(quantity) } }
      })
    ]);

    return res.status(201).json({
      success: true,
      message: "Check-out barang berhasil dicatat",
      data: checkoutRecord,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Proses Barang Masuk / Pengembalian (Check-in)
export const returnItem = async (req, res) => {
  try {
    const { id } = req.params; // ID riwayat checkout

    const checkoutRecord = await prisma.itemCheckout.findUnique({
      where: { id: Number(id) }
    });

    if (!checkoutRecord || checkoutRecord.status === "DIKEMBALIKAN") {
      return res.status(400).json({ success: false, message: "Data peminjaman tidak valid atau sudah dikembalikan." });
    }

    // Kembalikan status dan tambahkan kembali stok barang
    const [updatedRecord] = await prisma.$transaction([
      prisma.itemCheckout.update({
        where: { id: Number(id) },
        data: { status: "DIKEMBALIKAN" }
      }),
      prisma.item.update({
        where: { id: checkoutRecord.itemId },
        data: { stock: { increment: checkoutRecord.quantity } }
      })
    ]);

    return res.json({
      success: true,
      message: "Barang berhasil dikembalikan (Check-in)",
      data: updatedRecord,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};