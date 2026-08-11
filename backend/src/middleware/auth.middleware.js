import jwt from "jsonwebtoken";
import { ROLE_ADMIN, ROLE_IT_SUPPORT, ROLE_SUPERVISOR } from "../utils/roles.js";

const parseAuthorizationHeader = (header) => {
  if (!header) return null;
  const parts = header.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") return null;
  return parts[1];
};

const authMiddleware = (req, res, next) => {
  const header = req.headers.authorization;
  const token = parseAuthorizationHeader(header);

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Token tidak ditemukan atau format Authorization salah",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Token tidak valid",
    });
  }
};

// TAMBAHKAN EXPORT REQUIRE ROLE DI SINI
export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: "Akses ditolak",
    });
  }
  next();
};

export const adminOnly = requireRole(ROLE_ADMIN);
export const itSupportOnly = requireRole(ROLE_IT_SUPPORT, ROLE_ADMIN);
export const supervisorOnly = requireRole(ROLE_SUPERVISOR, ROLE_ADMIN);

export default authMiddleware;