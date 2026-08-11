import prisma from "../config/prisma.js";
import { sendWAMessage } from "../services/wa.service.js";

export const sendMessage = async (req, res) => {
  try {
    const { number, message } = req.body;
    if (!number || !message) return res.status(400).json({ success: false, message: "Data tidak lengkap" });
    await sendWAMessage(number, message);
    return res.json({ success: true, message: "Pesan dikirim" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const sendBulkMessage = async (req, res) => {
  try {
    const { numbers, message } = req.body;
    if (!numbers || !numbers.length || !message) {
      return res.status(400).json({ success: false, message: "Nomor dan pesan wajib diisi" });
    }
    const results = [];
    for (const number of numbers) {
      try {
        await sendWAMessage(number, message);
        results.push({ number, status: "success" });
      } catch (err) {
        results.push({ number, status: "failed", error: err.message });
      }
    }
    return res.json({ success: true, data: results });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const sendVisitNotification = async (req, res) => {
  try {
    const { visit } = req.body;
    if (!visit) return res.status(400).json({ success: false, message: "Data kunjungan wajib diisi" });
    
    const message = `*NOTIFIKASI KUNJUNGAN*\n\n*${visit.user?.name || "-"}* telah visit ke *${visit.branch?.name || "-"}*.\nKendala: ${visit.category || "-"}\nStatus: ${visit.status || "-"}`;
    const targetNumber = process.env.WA_GROUP_NUMBER;
    
    if (!targetNumber) throw new Error("Nomor WA grup belum disetting di file .env");
    
    await sendWAMessage(targetNumber, message);
    return res.json({ success: true, message: "Notifikasi dikirim" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const sendDailyReport = async (req, res) => {
  try {
    const visits = await prisma.visit.findMany({
      take: 10,
      include: {
        user: { select: { name: true } },
        branch: { select: { name: true, allowance: true } } 
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!visits || visits.length === 0) {
      return res.status(400).json({ success: false, message: "Tidak ada data kunjungan untuk dilaporkan." });
    }

    let totalAllowance = 0;
    let text = `*📊 REKAP KUNJUNGAN IT SUPPORT*\n📅 Laporan Terbaru\n\n`;

    visits.forEach((v, i) => {
      const allowanceVal = Number(v.allowance || v.branch?.allowance || 0);
      totalAllowance += allowanceVal;

      text += `*${i + 1}. ${v.branch?.name || "Cabang"}*\n`;
      text += `👤 Teknisi: ${v.user?.name || "Teknisi"}\n`;
      text += `🔧 Kendala: ${v.category || "-"}\n`;
      text += `⏱️ Status: ${v.status || "-"}\n`;
      text += `✅ Solusi: ${v.solution || '-'}\n\n`;
    });

    text += `*💰 Total Klaim Uang Jalan:* Rp ${totalAllowance.toLocaleString('id-ID')}\n`;
    text += `\n_Pesan otomatis dari Sistem Manajemen IT Support_`;

    const targetNumber = process.env.WA_GROUP_NUMBER;
    if (!targetNumber) {
      return res.status(500).json({ success: false, message: "Nomor tujuan (WA_GROUP_NUMBER) belum disetting di file .env backend" });
    }

    await sendWAMessage(targetNumber, text);

    return res.json({ success: true, message: "Laporan berhasil di-generate dan dikirim ke WhatsApp!" });
  } catch (error) {
    console.error("Error Send Daily Report:", error);
    return res.status(500).json({ success: false, message: error.message || "Gagal mengirim laporan" });
  }
};