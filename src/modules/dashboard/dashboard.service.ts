import { User } from "modules/auth/models/User.model.js";
import { Match } from "modules/matches/models/Match.model.js";
import { Submission } from "modules/submissions/models/Submission.model.js";
import logger from "../../shared/config/logger.js";

export interface DashboardStats {
  totalUsers: number;
  totalMatches: number;
  activeMatches: number;
  totalSubmissions: number;
}

class DashboardService {
  /**
   * Get dashboard statistics
   */
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const [totalUsers, totalMatches, activeMatches, totalSubmissions] = await Promise.all([
        User.countDocuments(),
        Match.countDocuments(),
        Match.countDocuments({ status: { $in: ["Upcoming", "Live"] } }),
        Submission.countDocuments(),
      ]);

      logger.info(
        {
          totalUsers,
          totalMatches,
          activeMatches,
          totalSubmissions,
        },
        "Dashboard stats calculated"
      );

      return {
        totalUsers,
        totalMatches,
        activeMatches,
        totalSubmissions,
      };
    } catch (error) {
      logger.error({ error }, "Error fetching dashboard stats");
      throw error;
    }
  }
}

export const dashboardService = new DashboardService();
