import { Router } from "express";
import * as contestController from "./contests.controller.js";
import { verifyAdminSession } from "../admin/admin.middleware.js";

const router: Router = Router();

/**
 * @route   GET /api/contests
 * @desc    Get contests by match ID
 * @access  Public
 */
router.get("/", contestController.getContests);

/**
 * @route   GET /api/contests/:id
 * @desc    Get contest by ID
 * @access  Public
 */
router.get("/:id", contestController.getContestById);

/**
 * @route   POST /api/contests
 * @desc    Create a new contest
 * @access  Admin only
 */
router.post("/", verifyAdminSession, contestController.createContest);
router.patch("/:id", verifyAdminSession, contestController.updateContest);

/**
 * @route   POST /api/contests/:id/join
 * @desc    Join a contest
 * @access  Public (User session verified via body/token if needed, but here simple)
 */
router.post("/:id/join", contestController.joinContest);

/**
 * @route   GET /api/contests/:id/leaderboard
 * @desc    Get leaderboard for a contest
 * @access  Public
 */
router.get("/:id/leaderboard", contestController.getLeaderboard);

/**
 * @route   DELETE /api/contests/:id
 * @desc    Delete a contest
 * @access  Admin only
 */
router.delete("/:id", verifyAdminSession, contestController.deleteContest);
/**
 * @route   GET /api/contests/match/:matchId/me
 * @desc    Get user's joined entries for a match
 * @access  Private (Needs verifyUserSession)
 */
import { verifyFirebaseToken } from "../auth/auth.middleware.js";
router.get("/match/:matchId/me", verifyFirebaseToken, contestController.getUserEntries);
router.get("/me/all", verifyFirebaseToken, contestController.getAllUserEntries);

/**
 * @route   POST /api/contests/:id/points
 * @desc    Update points for a contest
 * @access  Admin only
 */
router.post("/:id/points", verifyAdminSession, contestController.updatePoints);

/**
 * @route   POST /api/contests/:id/pay-prize
 * @desc    Pay prize money to a winner
 * @access  Admin only
 */
router.post("/:id/pay-prize", verifyAdminSession, contestController.payPrize);

/**
 * @route   POST /api/contests/:id/pay-all-prizes
 * @desc    Pay prize money to all winners
 * @access  Admin only
 */
router.post("/:id/pay-all-prizes", verifyAdminSession, contestController.payAllPrizes);

export default router;
