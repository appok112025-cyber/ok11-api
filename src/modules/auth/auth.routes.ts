import { Router } from "express";
import { getCurrentUser, updateFCMToken, updateProfile } from "./auth.controller.js";
import { verifyFirebaseToken } from "./auth.middleware.js";

const router: Router = Router();

/**
 * @route   GET /api/auth/me
 * @desc    Get current authenticated user
 * @access  Private (requires Firebase token)
 */
router.get("/me", verifyFirebaseToken, getCurrentUser);

/**
 * @route   PUT /api/auth/fcm-token
 * @desc    Update FCM token for current user
 * @access  Private (requires Firebase token)
 */
router.put("/fcm-token", verifyFirebaseToken, updateFCMToken);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile (name and phone)
 * @access  Private (requires Firebase token)
 */
router.put("/profile", verifyFirebaseToken, updateProfile);

export default router;
