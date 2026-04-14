import { Request, Response } from "express";
import { verifyCredentials, generateSessionToken, changePassword } from "./admin.service.js";
import logger from "../../shared/config/logger.js";
import { LoginDTO, ChangePasswordDTO } from "./admin.validators.js";

/**
 * Admin login controller
 * Verifies credentials and returns session token
 */
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body as LoginDTO;

    if (!email || !password) {
      logger.warn({ body: req.body }, "Missing email or password in login request");
      res.status(400).json({
        error: "Email and password are required",
        code: "MISSING_CREDENTIALS",
        timestamp: new Date().toISOString(),
      });
      return;
    }

    logger.info({ email, passwordLength: password.length }, "Login attempt received");

    // Verify credentials
    const admin = await verifyCredentials(email, password);

    // Generate session token
    const token = generateSessionToken(admin);

    logger.info(`Admin login successful: ${admin.email}`);

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token,
        admin: {
          id: admin._id,
          email: admin.email,
          role: admin.role,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    logger.error({ error }, "Admin login failed");

    const errorMessage = error instanceof Error ? error.message : "Login failed";

    res.status(401).json({
      error: errorMessage,
      code: "LOGIN_FAILED",
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Admin logout controller
 * Currently just returns success (token invalidation handled client-side)
 */
export async function logout(req: Request, res: Response): Promise<void> {
  try {
    const adminEmail = req.admin?.email || "unknown";

    logger.info(`Admin logout: ${adminEmail}`);

    res.status(200).json({
      success: true,
      message: "Logout successful",
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    logger.error({ error }, "Admin logout failed");

    res.status(500).json({
      error: "Logout failed",
      code: "LOGOUT_FAILED",
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Change admin password
 * Requires authenticated admin (verifyAdminSession middleware)
 */
export async function changeAdminPassword(req: Request, res: Response): Promise<void> {
  try {
    const adminId = req.admin?._id;

    if (!adminId) {
      res.status(401).json({
        error: "Authentication required",
        code: "AUTH_REQUIRED",
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const { currentPassword, newPassword, confirmPassword } = req.body as ChangePasswordDTO;

    if (!currentPassword || !newPassword || !confirmPassword) {
      res.status(400).json({
        error: "All password fields are required",
        code: "MISSING_PASSWORD_FIELDS",
        timestamp: new Date().toISOString(),
      });
      return;
    }

    await changePassword(adminId, currentPassword, newPassword);

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    logger.error({ error, adminId: req.admin?._id }, "Admin change password failed");

    const errorMessage = error instanceof Error ? error.message : "Failed to change password";

    let statusCode = 400;
    if (errorMessage === "Admin user not found") {
      statusCode = 404;
    } else if (errorMessage === "Invalid current password") {
      statusCode = 401;
    }

    res.status(statusCode).json({
      error: errorMessage,
      code: "CHANGE_PASSWORD_FAILED",
      timestamp: new Date().toISOString(),
    });
  }
}
