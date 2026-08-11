import prisma from "../config/prisma.js";

export const getDashboard = async (req, res) => {
  try {
    const now = new Date();
    const filter = req.query.filter || 'monthly';
    
    let startDate, endDate;

    // Menentukan rentang tanggal (Start & End) secara dinamis
    if (filter === 'daily') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    } else if (filter === 'weekly') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Senin s/d Minggu
      startDate = new Date(now.getFullYear(), now.getMonth(), diff);
      endDate = new Date(now.getFullYear(), now.getMonth(), diff + 6, 23, 59, 59, 999);
    } else if (filter === 'yearly') {
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    } else { // default: monthly
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    const dateFilter = { gte: startDate, lte: endDate };

    const [
      totalUsers,
      totalBranches,
      totalItems,
      totalCheckouts,
      totalReturns,
      filteredVisitsAll,       // Semua kunjungan di periode filter (untuk hitung allowance)
      filteredVisitsCompleted, // Kunjungan selesai di periode filter
      filteredVisitsPending,   // Kunjungan pending di periode filter
      recentVisits,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.branch.count(),
      prisma.item.count(),
      prisma.itemCheckout.count(),
      prisma.itemReturn.count(),
      // Tarik kunjungan HANYA sesuai filter (Harian/Mingguan/Bulanan/Tahunan)
      prisma.visit.findMany({
        where: { date: dateFilter },
        include: { branch: true }
      }),
      prisma.visit.count({ where: { status: 'SELESAI', date: dateFilter } }),
      prisma.visit.count({ where: { status: 'PENDING', date: dateFilter } }),
      prisma.visit.findMany({
        take: 5,
        orderBy: { date: "desc" },
        include: { user: { select: { id: true, name: true } }, branch: { select: { id: true, name: true } } },
      }),
    ]);

    // Kalkulasi uang jalan BENAR-BENAR DINAMIS
    let allowanceDynamicVal = 0;
    filteredVisitsAll.forEach(v => {
      const amount = Number(v.allowance || v.branch?.allowance || 0);
      allowanceDynamicVal += amount; 
    });

    return res.json({
      success: true,
      data: {
        totalUsers,
        totalBranches,
        totalItems,
        totalCheckouts,
        totalReturns,
        totalVisits: filteredVisitsAll.length, // Total dinamis
        completedVisits: filteredVisitsCompleted, // Solved dinamis
        pendingVisits: filteredVisitsPending, // Pending dinamis
        recentVisits,
        allowanceDynamic: allowanceDynamicVal, // Uang jalan dinamis
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getVisitStats = async (req, res) => {
  try {
    const visitsByMonth = await prisma.$queryRaw`
      SELECT DATE_FORMAT(date, '%Y-%m') as month, COUNT(*) as total,
      SUM(CASE WHEN status = 'SELESAI' THEN 1 ELSE 0 END) as completed,
      SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending
      FROM \`Visit\` GROUP BY DATE_FORMAT(date, '%Y-%m') ORDER BY month DESC LIMIT 12
    `;
    return res.json({ success: true, data: visitsByMonth });
  } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

export const getVisitDailyTrend = async (req, res) => {
  try {
    const visits = await prisma.visit.findMany({ select: { date: true, status: true }, orderBy: { date: 'asc' } });
    const trendMap = {};
    visits.forEach((v) => {
      const dateStr = new Date(v.date).toISOString().slice(0, 10);
      if (!trendMap[dateStr]) trendMap[dateStr] = { tanggal: dateStr, total: 0, completed: 0, pending: 0 };
      trendMap[dateStr].total += 1;
      if (v.status === 'SELESAI') trendMap[dateStr].completed += 1;
      if (v.status === 'PENDING') trendMap[dateStr].pending += 1;
    });
    return res.json({ success: true, data: Object.values(trendMap) });
  } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

export const getVisitFilteredTrend = async (req, res) => {
  try {
    const { type = 'daily' } = req.query;
    const visits = await prisma.visit.findMany({ select: { date: true, status: true }, orderBy: { date: 'asc' } });
    const trendMap = {};

    visits.forEach((v) => {
      const d = new Date(v.date);
      let key = '';
      if (type === 'daily') {
        key = d.toISOString().slice(0, 10);
      } else if (type === 'weekly') {
        const year = d.getFullYear();
        const startOfYear = new Date(year, 0, 1);
        const week = Math.ceil(((d - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
        key = `${year}-W${week < 10 ? '0' : ''}${week}`;
      } else if (type === 'monthly') {
        key = d.toISOString().slice(0, 7);
      } else if (type === 'yearly') {
        key = String(d.getFullYear());
      }

      if (!trendMap[key]) {
        trendMap[key] = { label: key, total: 0, completed: 0, pending: 0 };
      }
      trendMap[key].total += 1;
      if (v.status === 'SELESAI') trendMap[key].completed += 1;
      if (v.status === 'PENDING') trendMap[key].pending += 1;
    });

    return res.json({ success: true, data: Object.values(trendMap) });
  } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

export const getTopTechnicians = async (req, res) => {
  try {
    const topTechs = await prisma.visit.groupBy({ by: ["userId"], _count: { id: true }, orderBy: { _count: { id: "desc" } }, take: 5 });
    const users = await prisma.user.findMany({ where: { id: { in: topTechs.map((t) => t.userId) } }, select: { id: true, name: true } });
    const result = topTechs.map((t) => ({ user: users.find((u) => u.id === t.userId), total: t._count.id }));
    return res.json({ success: true, data: result });
  } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};