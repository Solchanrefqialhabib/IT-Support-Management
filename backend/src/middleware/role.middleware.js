export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized: Silakan login terlebih dahulu." });
    }

    // Periksa apakah role user termasuk dalam role yang diizinkan
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: "Akses ditolak: Anda tidak memiliki hak akses untuk melakukan aksi ini." 
      });
    }

    next();
  };
};