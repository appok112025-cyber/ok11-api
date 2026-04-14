import { Notification, INotification } from "./models/Notification.model.js";
import logger from "../../shared/config/logger.js";

export interface CreateNotificationDTO {
  title: string;
  body: string;
  image?: string;
}

export interface UpdateNotificationDTO {
  title?: string;
  body?: string;
  image?: string;
}

class NotificationService {
  /**
   * Create a new notification
   */
  async createNotification(data: CreateNotificationDTO): Promise<INotification> {
    try {
      const notificationData = {
        ...data,
        image: data.image && data.image.trim() ? data.image.trim() : undefined,
      };
      const notification = new Notification(notificationData);
      await notification.save();
      logger.info(
        { notificationId: notification._id, title: notification.title },
        "Notification created successfully"
      );
      return notification;
    } catch (error) {
      logger.error({ error, data }, "Error creating notification");
      throw error;
    }
  }

  /**
   * Update an existing notification
   */
  async updateNotification(
    notificationId: string,
    data: UpdateNotificationDTO
  ): Promise<INotification> {
    try {
      const updateData: any = { ...data };
      if (updateData.image !== undefined) {
        updateData.image =
          updateData.image && updateData.image.trim() ? updateData.image.trim() : undefined;
      }

      const notification = await Notification.findByIdAndUpdate(
        notificationId,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      if (!notification) {
        throw new Error("Notification not found");
      }

      logger.info({ notificationId, updates: updateData }, "Notification updated successfully");
      return notification;
    } catch (error) {
      logger.error({ error, notificationId, data }, "Error updating notification");
      throw error;
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      const notification = await Notification.findByIdAndDelete(notificationId);

      if (!notification) {
        throw new Error("Notification not found");
      }

      logger.info({ notificationId }, "Notification deleted successfully");
    } catch (error) {
      logger.error({ error, notificationId }, "Error deleting notification");
      throw error;
    }
  }

  /**
   * Get notification by ID
   */
  async getNotificationById(notificationId: string): Promise<INotification | null> {
    try {
      const notification = await Notification.findById(notificationId);
      return notification;
    } catch (error) {
      logger.error({ error, notificationId }, "Error fetching notification by ID");
      throw error;
    }
  }

  /**
   * Get all notifications
   */
  async getAllNotifications(): Promise<INotification[]> {
    try {
      const notifications = await Notification.find().sort({ createdAt: -1 });
      return notifications;
    } catch (error) {
      logger.error({ error }, "Error fetching all notifications");
      throw error;
    }
  }

  /**
   * Send notification to users via FCM
   */
  async sendNotification(notificationId: string): Promise<INotification> {
    try {
      const notification = await Notification.findById(notificationId);

      if (!notification) {
        throw new Error("Notification not found");
      }

      const { fcmService } = await import("../../shared/services/fcm.service.js");

      const payload = {
        title: notification.title,
        body: notification.body,
        imageUrl: notification.image,
        data: {
          type: "notification",
          notificationId: (notification._id as any).toString(),
        },
      };

      const topic = "general";
      const messageId = await fcmService.sendToTopic(topic, payload);
      logger.info(
        {
          notificationId,
          title: notification.title,
          topic,
          messageId,
        },
        "Notification sent successfully via FCM topic"
      );

      return notification;
    } catch (error) {
      logger.error({ error, notificationId }, "Error sending notification");
      throw error;
    }
  }
}

export const notificationService = new NotificationService();
