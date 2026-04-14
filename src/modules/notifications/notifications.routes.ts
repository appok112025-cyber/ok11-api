import { Router } from "express";
import { notificationController } from "./notifications.controller.js";
import { verifyAdminSession } from "modules/admin/admin.middleware.js";
import { validateBody, validateParams } from "../../shared/middleware/validation.js";
import {
  createNotificationSchema,
  updateNotificationSchema,
  notificationIdParamSchema,
} from "./notifications.validators.js";

const router: Router = Router();

/**
 * @route   GET /api/notifications
 * @desc    Get all notifications
 * @access  Admin only
 */
router.get(
  "/",
  verifyAdminSession,
  notificationController.getAllNotifications.bind(notificationController)
);

/**
 * @route   GET /api/notifications/:id
 * @desc    Get notification by ID
 * @access  Admin only
 */
router.get(
  "/:id",
  verifyAdminSession,
  validateParams(notificationIdParamSchema),
  notificationController.getNotificationById.bind(notificationController)
);

/**
 * @route   POST /api/notifications
 * @desc    Create a new notification
 * @access  Admin only
 */
router.post(
  "/",
  verifyAdminSession,
  validateBody(createNotificationSchema),
  notificationController.createNotification.bind(notificationController)
);

/**
 * @route   PUT /api/notifications/:id
 * @desc    Update a notification
 * @access  Admin only
 */
router.put(
  "/:id",
  verifyAdminSession,
  validateParams(notificationIdParamSchema),
  validateBody(updateNotificationSchema),
  notificationController.updateNotification.bind(notificationController)
);

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Delete a notification
 * @access  Admin only
 */
router.delete(
  "/:id",
  verifyAdminSession,
  validateParams(notificationIdParamSchema),
  notificationController.deleteNotification.bind(notificationController)
);

/**
 * @route   POST /api/notifications/:id/send
 * @desc    Send notification to users
 * @access  Admin only
 */
router.post(
  "/:id/send",
  verifyAdminSession,
  validateParams(notificationIdParamSchema),
  notificationController.sendNotification.bind(notificationController)
);

export default router;
