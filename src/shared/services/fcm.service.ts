import admin from "firebase-admin";
import { User } from "../../modules/auth/models/User.model.js";
import logger from "../config/logger.js";

export interface NotificationPayload {
  title: string;
  body: string;
  imageUrl?: string;
  data?: Record<string, string>;
}

export type NotificationType =
  | "general" // Admin general notifications
  | "match_live" // Match is now live
  | "match_reminder" // 30 min before match
  | "match_result"; // Match completed - result notification

class FCMService {
  /**
   * Send notification to a single FCM token
   */
  async sendToToken(token: string, payload: NotificationPayload): Promise<boolean> {
    try {
      const message: admin.messaging.Message = {
        token: token,
        notification: {
          title: payload.title,
          body: payload.body,
          imageUrl: payload.imageUrl,
        },
        data: payload.data || {},
        android: {
          priority: "high" as const,
        },
        apns: {
          headers: {
            "apns-priority": "10",
          },
        },
      };

      await admin.messaging().send(message);
      logger.info({ token: token.substring(0, 20) + "..." }, "FCM notification sent successfully");
      return true;
    } catch (error: any) {
      if (
        error.code === "messaging/invalid-registration-token" ||
        error.code === "messaging/registration-token-not-registered"
      ) {
        logger.warn(
          { token: token.substring(0, 20) + "...", error: error.code },
          "Invalid FCM token, removing from user"
        );
        await User.updateOne({ fcmToken: token }, { $unset: { fcmToken: 1 } });
      } else {
        logger.error(
          { error, token: token.substring(0, 20) + "..." },
          "Error sending FCM notification"
        );
      }
      return false;
    }
  }

  /**
   * Send notification to multiple FCM tokens
   */
  async sendToTokens(
    tokens: string[],
    payload: NotificationPayload
  ): Promise<{ success: number; failure: number }> {
    if (tokens.length === 0) {
      return { success: 0, failure: 0 };
    }

    try {
      const messages: admin.messaging.Message[] = tokens.map((token) => ({
        token: token,
        notification: {
          title: payload.title,
          body: payload.body,
          imageUrl: payload.imageUrl,
        },
        data: payload.data || {},
        android: {
          priority: "high" as const,
        },
        apns: {
          headers: {
            "apns-priority": "10",
          },
        },
      }));

      const batchResponse = await admin.messaging().sendEach(messages);

      let successCount = 0;
      let failureCount = 0;
      const invalidTokens: string[] = [];

      batchResponse.responses.forEach((response, idx) => {
        if (response.success) {
          successCount++;
        } else {
          failureCount++;
          if (
            response.error?.code === "messaging/invalid-registration-token" ||
            response.error?.code === "messaging/registration-token-not-registered"
          ) {
            invalidTokens.push(tokens[idx]);
          }
        }
      });

      if (invalidTokens.length > 0) {
        await User.updateMany({ fcmToken: { $in: invalidTokens } }, { $unset: { fcmToken: 1 } });
        logger.info({ count: invalidTokens.length }, "Removed invalid FCM tokens from users");
      }

      logger.info(
        { success: successCount, failure: failureCount, total: tokens.length },
        "FCM batch notification sent"
      );
      return { success: successCount, failure: failureCount };
    } catch (error) {
      logger.error({ error }, "Error sending FCM batch notifications");
      return { success: 0, failure: tokens.length };
    }
  }

  /**
   * Send notification to all users with FCM tokens
   */
  async sendToAllUsers(
    payload: NotificationPayload
  ): Promise<{ success: number; failure: number }> {
    try {
      const users = await User.find({
        fcmToken: { $exists: true, $nin: [null, ""] },
        blocked: false,
      })
        .select("fcmToken")
        .lean();

      const tokens = users.map((user) => user.fcmToken).filter((token): token is string => !!token);

      if (tokens.length === 0) {
        logger.warn("No FCM tokens found for users");
        return { success: 0, failure: 0 };
      }

      return await this.sendToTokens(tokens, payload);
    } catch (error) {
      logger.error({ error }, "Error sending FCM notification to all users");
      return { success: 0, failure: 0 };
    }
  }

  /**
   * Send notification to an FCM topic
   */
  async sendToTopic(topic: string, payload: NotificationPayload): Promise<string | null> {
    try {
      const notification: admin.messaging.Notification = {
        title: payload.title,
        body: payload.body,
      };

      // Only include imageUrl if it's a non-empty string
      if (payload.imageUrl && payload.imageUrl.trim()) {
        notification.imageUrl = payload.imageUrl.trim();
      }

      const message: admin.messaging.Message = {
        topic,
        notification,
        data: payload.data || {},
        android: {
          priority: "high" as const,
        },
        apns: {
          headers: {
            "apns-priority": "10",
          },
        },
      };

      const messageId = await admin.messaging().send(message);
      logger.info({ topic, messageId }, "FCM topic notification sent successfully");
      return messageId;
    } catch (error: any) {
      logger.error({ error: error.message || error, errorCode: error.code, topic }, "Error sending FCM topic notification");
      return null;
    }
  }

  /**
   * Send match live notification to general topic
   */
  async sendMatchLiveNotification(
    matchId: string,
    teamA: string,
    teamB: string,
    _teamAImageUrl?: string,
    _teamBImageUrl?: string
  ): Promise<string | null> {
    return this.sendToTopic("general", {
      title: "🔴 Match is LIVE!",
      body: `${teamA} vs ${teamB} is now live!`,
      data: {
        type: "match_live",
        matchId,
        action: "view_match",
      },
    });
  }

  /**
   * Send 30 min before match reminder notification to general topic
   */
  async sendMatchReminderNotification(
    matchId: string,
    teamA: string,
    teamB: string,
    _teamAImageUrl?: string,
    _teamBImageUrl?: string
  ): Promise<string | null> {
    return this.sendToTopic("general", {
      title: "⏰ Match Starting Soon!",
      body: `${teamA} vs ${teamB} starts in 30 minutes. Submit your predictions now!`,
      data: {
        type: "match_reminder",
        matchId,
        action: "view_match",
      },
    });
  }

  /**
   * Send match result notification to users who submitted for this match
   */
  async sendMatchResultNotification(
    matchId: string,
    teamA: string,
    teamB: string,
    score?: string,
    _teamAImageUrl?: string,
    _teamBImageUrl?: string
  ): Promise<string | null> {
    // Send to match-specific topic (users subscribe when they submit)
    const scoreText = score ? ` (${score})` : "";
    return this.sendToTopic(`match_${matchId}`, {
      title: "📊 Match Results Available!",
      body: `${teamA} vs ${teamB}${scoreText} - Check your score now!`,
      data: {
        type: "match_result",
        matchId,
        action: "view_score",
      },
    });
  }

  /**
   * Send silent data notification to trigger app refresh (no visible notification)
   * This is used when admin updates a match to refresh the mobile app data
   */
  async sendSilentMatchUpdate(matchId: string): Promise<string | null> {
    try {
      const message: admin.messaging.Message = {
        topic: "general",
        data: {
          type: "match_updated",
          matchId,
          action: "refresh_data",
          timestamp: Date.now().toString(),
        },
        android: {
          priority: "high" as const,
        },
        apns: {
          headers: {
            "apns-priority": "5",
            "apns-push-type": "background",
          },
          payload: {
            aps: {
              contentAvailable: true,
            },
          },
        },
      };

      const messageId = await admin.messaging().send(message);
      logger.info({ matchId, messageId }, "Silent match update notification sent");
      return messageId;
    } catch (error) {
      logger.error({ error, matchId }, "Error sending silent match update notification");
      return null;
    }
  }

  /**
   * Send notification to specific user tokens (for targeted notifications)
   */
  async sendToUserIds(
    userIds: string[],
    payload: NotificationPayload
  ): Promise<{ success: number; failure: number }> {
    try {
      const users = await User.find({
        _id: { $in: userIds },
        fcmToken: { $exists: true, $nin: [null, ""] },
        blocked: false,
      })
        .select("fcmToken")
        .lean();

      const tokens = users.map((user) => user.fcmToken).filter((token): token is string => !!token);

      if (tokens.length === 0) {
        logger.warn({ userIds }, "No FCM tokens found for specified users");
        return { success: 0, failure: 0 };
      }

      return await this.sendToTokens(tokens, payload);
    } catch (error) {
      logger.error({ error, userIds }, "Error sending FCM notification to user IDs");
      return { success: 0, failure: 0 };
    }
  }
}

export const fcmService = new FCMService();
