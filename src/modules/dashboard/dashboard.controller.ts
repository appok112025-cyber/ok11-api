import { Request, Response } from "express";
import { dashboardService } from "./dashboard.service.js";
import { sendSuccess } from "../../shared/utils/response.js";
import logger from "../../shared/config/logger.js";

class DashboardController {
  /**
   * Get dashboard statistics
   * @route GET /api/dashboard/stats
   * @access Public
   */
  async getDashboardStats(_req: Request, res: Response): Promise<void> {
    try {
      const stats = await dashboardService.getDashboardStats();
      sendSuccess(res, stats);
    } catch (error) {
      logger.error({ error }, "Error fetching dashboard stats");
      throw error;
    }
  }
}

export const dashboardController = new DashboardController();
