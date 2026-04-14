import { Router } from "express";
import { dashboardController } from "./dashboard.controller.js";

const router: Router = Router();

/**
 * @route   GET /api/dashboard/stats
 * @desc    Get dashboard statistics
 * @access  Public
 */
router.get("/stats", dashboardController.getDashboardStats.bind(dashboardController));

export default router;
