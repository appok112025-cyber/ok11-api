import { Request, Response, NextFunction } from "express";
import { auth } from "../../shared/config/firebase.js";
import { authService } from "./auth.service.js";
import logger from "shared/config/logger.js";

/**
 * Middleware to verify Firebase ID token and authenticate mobile users
 * Extracts Bearer token from Authorization header, verifies with Firebase,
 * syncs user to MongoDB, and attaches user to req.user
 */
export const verifyFirebaseToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        error: "Authorization header is required",
        code: "AUTH_HEADER_MISSING",
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Check if it's a Bearer token
    if (!authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        error: "Authorization header must use Bearer scheme",
        code: "INVALID_AUTH_SCHEME",
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Extract token
    const idToken = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!idToken) {
      res.status(401).json({
        error: "Token is required",
        code: "TOKEN_MISSING",
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Verify token with Firebase Admin SDK
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(idToken);
    } catch (error: any) {
      // Handle specific Firebase auth errors
      logger.warn(
        { err: error, token: idToken.substring(0, 20) + "..." },
        "Firebase token verification failed"
      );

      if (error.code === "auth/id-token-expired") {
        res.status(401).json({
          error: "Token has expired",
          code: "TOKEN_EXPIRED",
          timestamp: new Date().toISOString(),
        });
        return;
      }

      if (error.code === "auth/id-token-revoked") {
        res.status(401).json({
          error: "Token has been revoked",
          code: "TOKEN_REVOKED",
          timestamp: new Date().toISOString(),
        });
        return;
      }

      if (error.code === "auth/argument-error" || error.code === "auth/invalid-id-token") {
        res.status(401).json({
          error: "Invalid token",
          code: "TOKEN_INVALID",
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Generic auth failure
      res.status(401).json({
        error: "Authentication failed",
        code: "AUTH_FAILED",
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Sync user to MongoDB
    let user;
    try {
      user = await authService.syncUserFromFirebase(decodedToken);
    } catch (error: any) {
      logger.error(
        { err: error, firebaseUid: decodedToken.uid },
        "Failed to sync user from Firebase"
      );
      res.status(500).json({
        error: "Failed to sync user data",
        code: "USER_SYNC_FAILED",
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Check if user is blocked
    if (user.blocked) {
      logger.warn({ userId: user._id, email: user.email }, "Blocked user attempted to access API");
      res.status(403).json({
        error: "Your account has been blocked",
        code: "USER_BLOCKED",
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Attach user to request object
    req.user = {
      _id: String(user._id),
      firebaseUid: user.firebaseUid,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      blocked: user.blocked,
      walletBalance: (user as any).walletBalance ?? 0,
    };

    logger.debug({ userId: user._id, email: user.email }, "User authenticated successfully");

    // Continue to next middleware
    next();
  } catch (error: any) {
    // Catch any unexpected errors
    logger.error({ err: error }, "Unexpected error in Firebase token verification middleware");
    res.status(500).json({
      error: "Internal server error",
      code: "INTERNAL_ERROR",
      timestamp: new Date().toISOString(),
    });
  }
};
