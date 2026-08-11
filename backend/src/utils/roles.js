export const ROLE_ADMIN = "ADMIN";
export const ROLE_IT_SUPPORT = "IT_SUPPORT";
export const ROLE_SUPERVISOR = "SUPERVISOR";

export const validRoles = [ROLE_ADMIN, ROLE_IT_SUPPORT, ROLE_SUPERVISOR];

export const normalizeRole = (role) => {
  if (!role) return null;
  return role.toString().trim().toUpperCase().replace(/\s+/g, "_");
};

export const isValidRole = (role) => validRoles.includes(role);
