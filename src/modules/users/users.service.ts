import { User, IUser } from "modules/auth/models/User.model.js";
import { Submission } from "modules/submissions/models/Submission.model.js";
import {
  calculateSkip,
  createPaginatedResponse,
  PaginatedResult,
} from "../../shared/utils/pagination.js";
import logger from "../../shared/config/logger.js";
import { fcmService } from "../../shared/services/fcm.service.js";

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  blockedUsers: number;
  totalSubmissions: number;
}

class UserService {
  /**
   * Get all users with pagination and optional search
   */
  async getAllUsers(page: number, limit: number, search?: string): Promise<PaginatedResult<IUser>> {
    try {
      const skip = calculateSkip(page, limit);

      // Build search query
      const query: any = {};
      if (search) {
        query.$or = [
          { email: { $regex: search, $options: "i" } },
          { displayName: { $regex: search, $options: "i" } },
        ];
      }

      // Get users and total count
      const [users, total] = await Promise.all([
        User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
        User.countDocuments(query),
      ]);

      return createPaginatedResponse(users, total, page, limit);
    } catch (error) {
      logger.error({ error, page, limit, search }, "Error fetching users");
      throw error;
    }
  }

  /**
   * Get user by ID with submissions/matches
   */
  async getUserById(userId: string): Promise<any> {
    try {
      const user = await User.findById(userId);

      if (!user) {
        return null;
      }

      // Fetch user's submissions with match details
      const submissions = await Submission.find({ userId })
        .populate({
          path: "matchId",
          select: "teamA teamB matchTime status score matchNumber",
          populate: [
            { path: "teamA", select: "name" },
            { path: "teamB", select: "name" },
          ],
        })
        .sort({ submittedAt: -1 })
        .lean();

      // Transform submissions into matches format
      const matches = submissions
        .filter((submission: any) => submission.matchId) // Filter out submissions with deleted matches
        .map((submission: any) => {
          const match = submission.matchId;
          const teamAName = match.teamA?.name || "Team A";
          const teamBName = match.teamB?.name || "Team B";
          const teamNames = `${teamAName} vs ${teamBName}`;

          // Determine status based on submission status
          let status: "Won" | "Lost" | "Pending" = "Pending";
          if (submission.status === "completed") {
            status = "Won";
          } else if (submission.status === "evaluated") {
            status = "Lost";
          }

          return {
            submissionId: submission._id.toString(),
            matchId: match._id.toString(),
            date: submission.submittedAt,
            team: teamNames,
            score: `${submission.totalPointsEarned}/${submission.totalPoints}`,
            points: submission.totalPointsEarned,
            status,
          };
        });

      // Return user with matches
      return {
        ...user.toObject(),
        matches,
      };
    } catch (error) {
      logger.error({ error, userId }, "Error fetching user by ID");
      throw error;
    }
  }

  /**
   * Block a user
   */
  async blockUser(userId: string): Promise<IUser> {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        { $set: { blocked: true } },
        { new: true, runValidators: true }
      );

      if (!user) {
        throw new Error("User not found");
      }

      if (user.fcmToken) {
        try {
          await fcmService.sendToToken(user.fcmToken, {
            title: "Account Blocked",
            body: "Your account has been blocked. Please contact support for assistance.",
            data: {
              type: "user_blocked",
            },
          });
          logger.info({ userId }, "Block notification sent to user");
        } catch (fcmError) {
          logger.error({ error: fcmError, userId }, "Error sending block notification");
        }
      }

      logger.info({ userId }, "User blocked successfully");
      return user;
    } catch (error) {
      logger.error({ error, userId }, "Error blocking user");
      throw error;
    }
  }

  /**
   * Unblock a user
   */
  async unblockUser(userId: string): Promise<IUser> {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        { $set: { blocked: false } },
        { new: true, runValidators: true }
      );

      if (!user) {
        throw new Error("User not found");
      }

      if (user.fcmToken) {
        try {
          await fcmService.sendToToken(user.fcmToken, {
            title: "Account Unblocked",
            body: "Your account has been unblocked. You can now access the app again.",
            data: {
              type: "user_unblocked",
            },
          });
          logger.info({ userId }, "Unblock notification sent to user");
        } catch (fcmError) {
          logger.error({ error: fcmError, userId }, "Error sending unblock notification");
        }
      }

      logger.info({ userId }, "User unblocked successfully");
      return user;
    } catch (error) {
      logger.error({ error, userId }, "Error unblocking user");
      throw error;
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(): Promise<UserStats> {
    try {
      const [totalUsers, blockedUsers, activeUsers, totalSubmissions] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ blocked: true }),
        User.countDocuments({ lastLoginAt: { $exists: true } }),
        Submission.countDocuments(),
      ]);

      return {
        totalUsers,
        activeUsers,
        blockedUsers,
        totalSubmissions,
      };
    } catch (error) {
      logger.error({ error }, "Error fetching user stats");
      throw error;
    }
  }
}

export const userService = new UserService();
