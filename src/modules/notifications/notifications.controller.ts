import { Request, Response } from "express";
import { notificationService } from "./notifications.service.js";
import {
  sendSuccess,
  sendCreated,
  sendNotFound,
  sendNoContent,
} from "../../shared/utils/response.js";
import logger from "../../shared/config/logger.js";

export class NotificationController {
  /**
   * Get all notifications
   * Admin only
   */
  async getAllNotifications(_req: Request, res: Response): Promise<void> {
    try {
      const notifications = await notificationService.getAllNotifications();
      sendSuccess(res, notifications);
    } catch (error) {
      logger.error({ error }, "Error fetching notifications");
      throw error;
    }
  }

  /**
   * Get notification by ID
   * Admin only
   */
  async getNotificationById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const notification = await notificationService.getNotificationById(id);

      if (!notification) {
        sendNotFound(res, "Notification not found");
        return;
      }

      sendSuccess(res, notification);
    } catch (error) {
      logger.error({ error, notificationId: req.params.id }, "Error fetching notification");
      throw error;
    }
  }

  /**
   * Create a new notification
   * Admin only
   */
  async createNotification(req: Request, res: Response): Promise<void> {
    try {
      const notificationData = req.body;
      const notification = await notificationService.createNotification(notificationData);
      sendCreated(res, notification);
    } catch (error) {
      logger.error({ error, body: req.body }, "Error creating notification");
      throw error;
    }
  }

  /**
   * Update a notification
   * Admin only
   */
  async updateNotification(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const notification = await notificationService.updateNotification(id, updateData);
      sendSuccess(res, notification);
    } catch (error) {
      if (error instanceof Error && error.message === "Notification not found") {
        sendNotFound(res, "Notification not found");
        return;
      }
      logger.error(
        { error, notificationId: req.params.id, body: req.body },
        "Error updating notification"
      );
      throw error;
    }
  }

  /**
   * Delete a notification
   * Admin only
   */
  async deleteNotification(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await notificationService.deleteNotification(id);
      sendNoContent(res);
    } catch (error) {
      if (error instanceof Error && error.message === "Notification not found") {
        sendNotFound(res, "Notification not found");
        return;
      }
      logger.error({ error, notificationId: req.params.id }, "Error deleting notification");
      throw error;
    }
  }

  /**
   * Send notification to users
   * Admin only
   */
  async sendNotification(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const notification = await notificationService.sendNotification(id);
      sendSuccess(res, notification);
    } catch (error) {
      if (error instanceof Error && error.message === "Notification not found") {
        sendNotFound(res, "Notification not found");
        return;
      }
      logger.error({ error, notificationId: req.params.id }, "Error sending notification");
      throw error;
    }
  }
}

export const notificationController = new NotificationController();
