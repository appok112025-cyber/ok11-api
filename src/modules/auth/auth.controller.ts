import { Request, Response } from "express";
import { authService } from "./auth.service.js";
import logger from "shared/config/logger.js";
import { sendSuccess } from "../../shared/utils/response.js";

/**
 * Get current authenticated user
 */
export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  try {
    // User is already attached to req.user by verifyFirebaseToken middleware
    if (!req.user) {
      res.status(401).json({
        error: "Unauthorized",
        message: "User not authenticated",
        code: "AUTH_REQUIRED",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        user: req.user,
      },
    });
  } catch (error) {
    logger.error({ err: error }, "Error in getCurrentUser controller");
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to get user data",
    });
  }
};

/**
 * Update FCM token for current user
 */
export const updateFCMToken = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: "Unauthorized",
        message: "User not authenticated",
        code: "AUTH_REQUIRED",
      });
      return;
    }

    const { fcmToken, lastLoginAt, appVersion } = req.body;

    if (!fcmToken || typeof fcmToken !== "string") {
      res.status(400).json({
        error: "FCM token is required",
        code: "INVALID_INPUT",
      });
      return;
    }

    const user = await authService.updateFCMToken(
      req.user.firebaseUid,
      fcmToken,
      lastLoginAt ? new Date(lastLoginAt as string) : undefined,
      appVersion as string | undefined
    );
    sendSuccess(res, { user });
  } catch (error) {
    logger.error({ err: error, firebaseUid: req.user?.firebaseUid }, "Error updating FCM token");
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to update FCM token",
    });
  }
};

/**
 * Update user profile (name and phone)
 */
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: "Unauthorized",
        message: "User not authenticated",
        code: "AUTH_REQUIRED",
      });
      return;
    }

    const { displayName, phone } = req.body;

    const user = await authService.updateProfile(req.user.firebaseUid, displayName, phone);
    sendSuccess(res, { user });
  } catch (error) {
    logger.error({ err: error, firebaseUid: req.user?.firebaseUid }, "Error updating profile");
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to update profile",
    });
  }
};
