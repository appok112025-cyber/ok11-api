import { Request, Response } from "express";
import { matchService } from "./matches.service.js";
import {
  sendSuccess,
  sendCreated,
  sendNotFound,
  sendNoContent,
  sendBadRequest,
} from "../../shared/utils/response.js";
import { parsePaginationParams } from "../../shared/utils/pagination.js";
import logger from "../../shared/config/logger.js";

export class MatchController {
  /**
   * Get all matches with pagination and filters
   * Public endpoint
   */
  async getMatches(req: Request, res: Response): Promise<void> {
    try {
      // Use validatedQuery if available (from validation middleware), otherwise fall back to req.query
      const query = (req as any).validatedQuery || req.query;
      const { status } = query;
      const { page, limit } = parsePaginationParams(
        query.page as string | number,
        query.limit as string | number
      );

      const filters = {
        status: status as any,
      };

      const result = await matchService.getAllMatches(filters, page, limit);
      sendSuccess(res, result);
    } catch (error) {
      logger.error({ error }, "Error fetching matches");
      throw error;
    }
  }

  /**
   * Get match by ID with populated players
   * Public endpoint
   */
  async getMatchById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const match = await matchService.getMatchById(id);

      if (!match) {
        sendNotFound(res, "Match not found");
        return;
      }

      sendSuccess(res, match);
    } catch (error) {
      logger.error({ error, matchId: req.params.id }, "Error fetching match");
      throw error;
    }
  }

  /**
   * Create a new match
   * Admin only
   */
  async createMatch(req: Request, res: Response): Promise<void> {
    try {
      const matchData = req.body;

      // Convert matchTime string to Date if needed
      if (typeof matchData.matchTime === "string") {
        matchData.matchTime = new Date(matchData.matchTime);
      }

      // Log quizzes data for debugging
      logger.info(
        {
          quizzes: matchData.quizzes,
          quizzesCount: matchData.quizzes?.length,
        },
        "Creating match with quizzes"
      );

      const match = await matchService.createMatch(matchData);

      // Log created match quizzes
      logger.info(
        {
          matchId: match._id,
          quizzesCount: match.quizzes?.length,
        },
        "Match created"
      );

      sendCreated(res, match);
    } catch (error: any) {
      logger.error({ error, body: req.body }, "Error creating match");

      // Handle duplicate match number error
      if (error?.code === 11000 || (error?.message && error.message.includes("matchNumber") && error.message.includes("duplicate key"))) {
        sendBadRequest(res, "Match number already exists. Please choose a different match number.");
        return;
      }

      throw error;
    }
  }

  /**
   * Update a match
   * Admin only
   * Note: Changing status to 'Live' or 'Completed' locks all submissions
   */
  async updateMatch(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Convert matchTime string to Date if needed
      if (updateData.matchTime && typeof updateData.matchTime === "string") {
        updateData.matchTime = new Date(updateData.matchTime);
      }

      const match = await matchService.updateMatch(id, updateData);
      sendSuccess(res, match);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "Match not found") {
        sendNotFound(res, "Match not found");
        return;
        }
        if (error.message.includes("Cannot change status to Completed")) {
          sendBadRequest(res, error.message);
          return;
        }
      }
      logger.error({ error, matchId: req.params.id, body: req.body }, "Error updating match");
      throw error;
    }
  }

  /**
   * Delete a match
   * Admin only
   */
  async deleteMatch(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await matchService.deleteMatch(id);
      sendNoContent(res);
    } catch (error) {
      if (error instanceof Error && error.message === "Match not found") {
        sendNotFound(res, "Match not found");
        return;
      }
      logger.error({ error, matchId: req.params.id }, "Error deleting match");
      throw error;
    }
  }
}

export const matchController = new MatchController();
