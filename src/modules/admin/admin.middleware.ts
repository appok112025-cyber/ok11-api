import { Request, Response, NextFunction } from "express";
import { verifySessionToken } from "./admin.service.js";
import logger from "../../shared/config/logger.js";

/**
 * Middleware to verify admin session token
 * Extracts Bearer token from Authorization header, verifies it,
 * and attaches admin user to req.admin
 */
export async function verifyAdminSession(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        error: "Authentication required",
        code: "AUTH_REQUIRED",
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      res.status(401).json({
        error: "Authentication token missing",
        code: "TOKEN_MISSING",
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Verify token and get admin user
    const admin = await verifySessionToken(token);

    // Attach admin to request object
    if (!admin.email || !admin.role) {
      throw new Error("Invalid admin data");
    }

    req.admin = {
      _id: String(admin._id),
      email: admin.email,
      role: admin.role,
    };

    next();
  } catch (error: unknown) {
    logger.error({ error }, "Admin authentication failed");

    const errorMessage = error instanceof Error ? error.message : "Authentication failed";

    res.status(401).json({
      error: errorMessage,
      code: "AUTH_FAILED",
      timestamp: new Date().toISOString(),
    });
  }
}
