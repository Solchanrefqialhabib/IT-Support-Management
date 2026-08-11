import ExcelJS from 'exceljs';
import prisma from '../config/prisma.js';

// Fungsi pembantu untuk filter tanggal
const getDateFilter = (startDate, endDate) => {
  if (startDate && endDate) {
    return {
      gte: new Date(`${startDate}T00:00:00.000Z`),
      lte: new Date(`${endDate}T23:59:59.999Z`),
    };
  }
  return undefined;
};

// 1. Ekspor Laporan Perjalanan Dinas / Kunjungan
export const exportVisitsExcel = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = getDateFilter(startDate, endDate);

    // Ambil data user secara langsung dari database agar nama & jabatan sesuai akun yang login
    const currentUser = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { name: true, role: true }
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Laporan Perjalanan Dinas');

    sheet.mergeCells('A1:I1');
    sheet.getCell('A1').value = 'LAPORAN PERJALANAN DINAS DALAM KOTA';
    sheet.getCell('A1').font = { bold: true, size: 14 };
    sheet.getCell('A1').alignment = { horizontal: 'center' };

    sheet.getCell('A3').value = 'Nama:'; 
    sheet.getCell('B3').value = currentUser?.name || 'Staff IT';
    
    sheet.getCell('A4').value = 'Jabatan:'; 
    sheet.getCell('B4').value = currentUser?.role === 'IT_SUPPORT' ? 'IT Support' : (currentUser?.role || 'Staff IT & Support');
    
    sheet.getCell('A5').value = 'Periode:'; 
    sheet.getCell('B5').value = startDate && endDate ? `${startDate} s/d ${endDate}` : 'Semua Periode';

    const headerRowNumber = 7;
    sheet.getRow(headerRowNumber).values = [
      'No', 'Tanggal Dinas', 'Lokasi', 'Kegiatan', 'Sebelum (Before)', 'Sesudah (After)', 'Foto Before', 'Foto After', 'Status'
    ];

    sheet.getRow(headerRowNumber).font = { bold: true, color: { argb: 'FFFFFF' } };
    sheet.getRow(headerRowNumber).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1F4E78' } };
    sheet.getRow(headerRowNumber).alignment = { horizontal: 'center', vertical: 'middle' };

    const visits = await prisma.visit.findMany({
      where: dateFilter ? { date: dateFilter } : {},
      include: { branch: true, user: true },
      orderBy: { date: 'asc' }
    });

    visits.forEach((v, index) => {
      const row = sheet.addRow([
        index + 1,
        new Date(v.date).toLocaleDateString('id-ID'),
        v.branch?.name || '-',
        v.category || '-',
        v.beforeCondition || '-',
        v.solution || '-',
        v.beforeImage ? { text: '📷 Lihat Foto', hyperlink: `http://localhost:5000${v.beforeImage}` } : '-',
        v.afterImage ? { text: '📷 Lihat Foto', hyperlink: `http://localhost:5000${v.afterImage}` } : '-',
        v.status || '-'
      ]);

      if (v.beforeImage) {
        row.getCell(7).font = { color: { argb: 'FF0000FF' }, underline: true };
      }
      if (v.afterImage) {
        row.getCell(8).font = { color: { argb: 'FF0000FF' }, underline: true };
      }
    });

    sheet.columns = [
      { width: 6 }, { width: 15 }, { width: 22 }, { width: 30 }, { width: 35 }, { width: 35 }, { width: 15 }, { width: 15 }, { width: 15 }
    ];

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber >= headerRowNumber) {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin', color: { argb: 'D3D3D3' } },
            left: { style: 'thin', color: { argb: 'D3D3D3' } },
            bottom: { style: 'thin', color: { argb: 'D3D3D3' } },
            right: { style: 'thin', color: { argb: 'D3D3D3' } }
          };
          cell.alignment = { vertical: 'top', wrapText: true }; 
        });
      }
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Laporan_Perjalanan_Dinas_${startDate || 'all'}_sd_${endDate || 'all'}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Ekspor Laporan Check-out Inventaris
export const exportCheckouts = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = getDateFilter(startDate, endDate);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Laporan Check-out Aset');

    sheet.mergeCells('A1:G1');
    sheet.getCell('A1').value = 'LAPORAN KELUAR MASUK ASET IT';
    sheet.getCell('A1').font = { bold: true, size: 14 };
    sheet.getCell('A1').alignment = { horizontal: 'center' };

    const headerRowNumber = 4;
    sheet.getRow(headerRowNumber).values = ['No', 'Tanggal', 'Nama Barang', 'Jumlah', 'Cabang Tujuan', 'Keperluan', 'Teknisi'];
    sheet.getRow(headerRowNumber).font = { bold: true, color: { argb: 'FFFFFF' } };
    sheet.getRow(headerRowNumber).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC00000' } };

    const checkouts = await prisma.itemCheckout.findMany({
      where: dateFilter ? { date: dateFilter } : {},
      include: { item: true, branch: true, user: true },
      orderBy: { date: 'asc' }
    });

    checkouts.forEach((c, index) => {
      sheet.addRow([
        index + 1,
        new Date(c.date).toLocaleDateString('id-ID'),
        c.item?.itemName || '-',
        c.quantity,
        c.branch?.name || '-',
        c.notes || c.purpose || '-',
        c.user?.name || '-'
      ]);
    });

    sheet.columns = [{ width: 6 }, { width: 15 }, { width: 25 }, { width: 10 }, { width: 20 }, { width: 30 }, { width: 20 }];

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Laporan_Checkouts_Aset.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Ekspor Laporan Retur Barang / RMA
export const exportReturns = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = getDateFilter(startDate, endDate);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Laporan Retur Aset');

    sheet.mergeCells('A1:G1');
    sheet.getCell('A1').value = 'LAPORAN RETUR / KERUSAKAN PERANGKAT IT';
    sheet.getCell('A1').font = { bold: true, size: 14 };
    sheet.getCell('A1').alignment = { horizontal: 'center' };

    const headerRowNumber = 4;
    sheet.getRow(headerRowNumber).values = ['No', 'Tanggal', 'Nama Barang', 'Cabang Asal', 'Serial Number', 'Kerusakan', 'Status'];
    sheet.getRow(headerRowNumber).font = { bold: true, color: { argb: 'FFFFFF' } };
    sheet.getRow(headerRowNumber).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF385D8A' } };

    const returns = await prisma.itemReturn.findMany({
      where: dateFilter ? { date: dateFilter } : {},
      include: { item: true, branch: true },
      orderBy: { date: 'asc' }
    });

    returns.forEach((r, index) => {
      sheet.addRow([
        index + 1,
        new Date(r.date).toLocaleDateString('id-ID'),
        r.item?.itemName || '-',
        r.branch?.name || '-',
        r.serialNumber || '-',
        r.damage || '-',
        r.status || '-'
      ]);
    });

    sheet.columns = [{ width: 6 }, { width: 15 }, { width: 25 }, { width: 20 }, { width: 20 }, { width: 30 }, { width: 15 }];

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Laporan_Retur_Aset.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};