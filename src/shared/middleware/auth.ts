import { Request, Response, NextFunction } from "express";
import { verifyFirebaseToken } from "../../modules/auth/auth.middleware.js";

/**
 * Middleware to allow both user and admin authentication
 * Tries admin authentication first, then falls back to Firebase user authentication
 *
 * @usage Use this middleware for routes that should be accessible by both admins and regular users
 */
export async function allowUserOrAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      error: "Authentication required",
      code: "AUTH_REQUIRED",
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const token = authHeader.substring(7);

  // Try admin authentication first
  try {
    const { verifySessionToken } = await import("../../modules/admin/admin.service.js");
    const admin = await verifySessionToken(token);

    if (admin && admin.email && admin.role) {
      req.admin = {
        _id: String(admin._id),
        email: admin.email,
        role: admin.role,
      };
      next();
      return;
    }
  } catch (error) {
    // Admin auth failed, continue to try user auth
  }

  // Try user authentication (Firebase)
  try {
    await verifyFirebaseToken(req, res, next);
  } catch (error) {
    // Both failed, return 401
    if (!res.headersSent) {
      res.status(401).json({
        error: "Authentication required",
        code: "AUTH_REQUIRED",
        timestamp: new Date().toISOString(),
      });
    }
  }
}
