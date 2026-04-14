import { Router } from "express";
import { login, logout, changeAdminPassword } from "./admin.controller.js";
import { verifyAdminSession } from "./admin.middleware.js";
import { validateBody } from "../../shared/middleware/validation.js";
import { loginSchema, changePasswordSchema } from "./admin.validators.js";

const router: Router = Router();

// POST /api/auth/admin/login - Admin login
router.post("/login", validateBody(loginSchema), login);

// POST /api/auth/admin/logout - Admin logout (requires authentication)
router.post("/logout", verifyAdminSession, logout);

// POST /api/auth/admin/change-password - Change admin password (requires authentication)
router.post(
  "/change-password",
  verifyAdminSession,
  validateBody(changePasswordSchema),
  changeAdminPassword
);

export default router;
