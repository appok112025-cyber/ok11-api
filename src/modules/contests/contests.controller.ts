import { Request, Response } from "express";
import { contestService } from "./contests.service.js";
import logger from "../../shared/config/logger.js";

/**
 * Get contests for a specific match
 */
export const getContests = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { matchId } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    let result;
    if (matchId) {
      result = await contestService.getContestsByMatch(
        matchId as string,
        page,
        limit
      );
    } else {
      result = await contestService.getAllContests(
        page,
        limit
      );
    }

    return res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    logger.error({ error: error.message }, "Error in getContests");
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Create a new contest
 */
export const createContest = async (req: Request, res: Response): Promise<Response> => {
  try {
    const contest = await contestService.createContest(req.body);
    return res.status(201).json({
      success: true,
      data: contest,
    });
  } catch (error: any) {
    logger.error({ error: error.message }, "Error in createContest");
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Update an existing contest
 */
export const updateContest = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const contest = await contestService.updateContest(id, req.body);
    if (!contest) {
      return res.status(404).json({ error: "Contest not found" });
    }
    return res.json({
      success: true,
      data: contest,
    });
  } catch (error: any) {
    logger.error({ error: error.message }, "Error in updateContest");
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Get contest by ID
 */
export const getContestById = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const contest = await contestService.getContestById(id);

    if (!contest) {
      return res.status(404).json({ error: "Contest not found" });
    }

    return res.json({
      success: true,
      data: contest,
    });
  } catch (error: any) {
    logger.error({ error: error.message }, "Error in getContestById");
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Join a contest
 */
export const joinContest = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const entry = await contestService.joinContest(id, req.body);
    return res.status(201).json({
      success: true,
      data: entry,
    });
  } catch (error: any) {
    if (error.message === "ALREADY_JOINED") {
      return res.status(409).json({ error: "You have already joined this contest" });
    }
    if (error.message === "CONTEST_FULL") {
      return res.status(409).json({ error: "This contest is already full! Please join another contest." });
    }
    if (error.message === "MATCH_ALREADY_STARTED") {
      return res.status(403).json({ error: "Match has already started. You cannot join or edit squad now." });
    }
    logger.error({ error: error.message }, "Error in joinContest");
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Get leaderboard
 */
export const getLeaderboard = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const leaderboard = await contestService.getLeaderboard(id);

    // Disable HTTP caching for mobile and web browsers
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    return res.json({
      success: true,
      data: leaderboard,
    });
  } catch (error: any) {
    logger.error({ error: error.message }, "Error in getLeaderboard");
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Delete a contest
 */
export const deleteContest = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const deleted = await contestService.deleteContest(id);

    if (!deleted) {
      return res.status(404).json({ error: "Contest not found" });
    }

    return res.json({
      success: true,
      message: "Contest deleted successfully",
    });
  } catch (error: any) {
    logger.error({ error: error.message }, "Error in deleteContest");
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Update points for a contest
 */
export const updatePoints = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const { playerPoints } = req.body;
    
    if (!playerPoints) {
      return res.status(400).json({ error: "playerPoints object is required" });
    }

    const success = await contestService.updateContestPoints(id, playerPoints);
    
    return res.json({
      success,
      message: "Points updated successfully",
    });
  } catch (error: any) {
    logger.error({ error: error.message }, "Error in updatePoints");
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Get user's joined entries for a match
 */
export const getUserEntries = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { matchId } = req.params;
    const userId = (req as any).user?._id; // Getting user from token

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const entries = await contestService.getUserEntries(matchId, userId);
    
    return res.json({
      success: true,
      data: entries,
    });
  } catch (error: any) {
    logger.error({ error: error.message }, "Error in getUserEntries");
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Get all joined entries for a user across all matches
 */
export const getAllUserEntries = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = (req as any).user?._id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const entries = await contestService.getAllUserEntries(userId);
    
    return res.json({
      success: true,
      data: entries,
    });
  } catch (error: any) {
    logger.error({ error: error.message }, "Error in getAllUserEntries");
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Pay prize money to a user
 */
export const payPrize = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }
    await contestService.payPrize(id as string, userId as string);
    return res.json({
      success: true,
      message: "Prize money sent successfully",
    });
  } catch (error: any) {
    logger.error({ error: error.message }, "Error in payPrize");
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Pay prize money to all winners of a contest
 */
export const payAllPrizes = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const result = await contestService.payAllPrizes(id as string);
    return res.json({
      success: true,
      message: `Successfully paid prizes to ${result.count} winners (Total: ₹${result.totalAmount})`,
      data: result,
    });
  } catch (error: any) {
    logger.error({ error: error.message }, "Error in payAllPrizes");
    return res.status(500).json({ error: error.message });
  }
};
