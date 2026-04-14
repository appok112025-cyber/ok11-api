import { Request, Response } from "express";
import { submissionService } from "./submissions.service.js";
import {
  sendSuccess,
  sendCreated,
  sendNotFound,
  sendForbidden,
  sendBadRequest,
} from "../../shared/utils/response.js";
import { parsePaginationParams } from "../../shared/utils/pagination.js";
import logger from "../../shared/config/logger.js";

export class SubmissionController {
  /**
   * Get all submissions with filters and pagination
   * Admin only
   */
  async getSubmissions(req: Request, res: Response): Promise<void> {
    try {
      const { userId, matchId, status } = req.query;
      const { page, limit } = parsePaginationParams(
        req.query.page as string,
        req.query.limit as string
      );

      const filters: {
        userId?: string;
        matchId?: string;
        status?: string;
      } = {};

      if (userId) filters.userId = userId as string;
      if (matchId) filters.matchId = matchId as string;
      if (status) filters.status = status as string;

      const result = await submissionService.getAllSubmissions(filters, page, limit);
      sendSuccess(res, result);
    } catch (error) {
      logger.error({ error }, "Error fetching submissions");
      throw error;
    }
  }

  /**
   * Get submission by ID
   * User (own) or Admin
   */
  async getSubmissionById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const submission = await submissionService.getSubmissionById(id);

      if (!submission) {
        sendNotFound(res, "Submission not found");
        return;
      }

      // Check ownership if user (not admin)
      if (req.user && !req.admin) {
        if (submission.userId.toString() !== req.user._id) {
          sendForbidden(res, "You can only view your own submissions");
          return;
        }
      }

      // If match is completed, return aggregated data with quiz questions
      const match = submission.matchId as any;
      if (match && match.status === "Completed") {
        const aggregatedData = submissionService.aggregateSubmissionData(submission);
        sendSuccess(res, aggregatedData);
        return;
      }

      sendSuccess(res, submission);
    } catch (error) {
      logger.error({ error, submissionId: req.params.id }, "Error fetching submission");
      throw error;
    }
  }

  /**
   * Get submissions by user
   * User (own) or Admin
   */
  async getUserSubmissions(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { page, limit } = parsePaginationParams(
        req.query.page as string,
        req.query.limit as string
      );

      // Check ownership if user (not admin)
      if (req.user && !req.admin) {
        if (userId !== req.user._id) {
          sendForbidden(res, "You can only view your own submissions");
          return;
        }
      }

      const result = await submissionService.getSubmissionsByUser(userId, page, limit);
      sendSuccess(res, result);
    } catch (error) {
      logger.error({ error, userId: req.params.userId }, "Error fetching user submissions");
      throw error;
    }
  }

  /**
   * Get submissions by match
   * Admin only
   */
  async getMatchSubmissions(req: Request, res: Response): Promise<void> {
    try {
      const { matchId } = req.params;
      const { page, limit } = parsePaginationParams(
        req.query.page as string,
        req.query.limit as string
      );

      const result = await submissionService.getSubmissionsByMatch(matchId, page, limit);
      sendSuccess(res, result);
    } catch (error) {
      logger.error({ error, matchId: req.params.matchId }, "Error fetching match submissions");
      throw error;
    }
  }

  /**
   * Get current user's submission for a specific match
   * User only
   */
  async getUserSubmissionForMatch(req: Request, res: Response): Promise<void> {
    try {
      const { matchId } = req.params;
      const userId = req.user!._id;

      const submission = await submissionService.getUserSubmissionForMatch(userId, matchId);

      if (!submission) {
        sendSuccess(res, null);
        return;
      }

      sendSuccess(res, submission);
    } catch (error) {
      logger.error(
        { error, matchId: req.params.matchId, userId: req.user?._id },
        "Error fetching user submission for match"
      );
      throw error;
    }
  }

  /**
   * Get current user's submission history
   * User only
   */
  async getCurrentUserSubmissions(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!._id;
      const { page, limit } = parsePaginationParams(
        req.query.page as string,
        req.query.limit as string
      );

      const result = await submissionService.getSubmissionsByUser(userId, page, limit);
      sendSuccess(res, result);
    } catch (error) {
      logger.error({ error, userId: req.user?._id }, "Error fetching current user submissions");
      throw error;
    }
  }

  /**
   * Create a new submission
   * User only
   */
  async createSubmission(req: Request, res: Response): Promise<void> {
    try {
      const submissionData = req.body;

      const submission = await submissionService.createSubmission(submissionData);
      sendCreated(res, submission);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "Match not found") {
          sendNotFound(res, "Match not found");
          return;
        }
        if (error.message === "Submission deadline has passed") {
          sendForbidden(res, "Submission deadline has passed");
          return;
        }
        if (error.message === "Submissions are only allowed for upcoming matches") {
          sendForbidden(res, "Submissions are only allowed for upcoming matches");
          return;
        }
        if (error.message === "You have already submitted for this match") {
          sendBadRequest(res, "You have already submitted for this match");
          return;
        }
      }
      logger.error({ error, userId: req.user?._id, body: req.body }, "Error creating submission");
      throw error;
    }
  }

  /**
   * Update a submission
   * User (own) only
   */
  async updateSubmission(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!._id;
      const updateData = req.body;

      const submission = await submissionService.updateSubmission(id, userId, updateData);
      sendSuccess(res, submission);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "Submission not found") {
          sendNotFound(res, "Submission not found");
          return;
        }
        if (error.message === "You can only update your own submissions") {
          sendForbidden(res, "You can only update your own submissions");
          return;
        }
        if (error.message === "Match not found") {
          sendNotFound(res, "Match not found");
          return;
        }
        if (error.message === "Submission deadline has passed") {
          sendForbidden(res, "Submission deadline has passed");
          return;
        }
        if (error.message === "Submissions can only be updated for upcoming matches") {
          sendForbidden(res, "Submissions can only be updated for upcoming matches");
          return;
        }
      }
      logger.error(
        { error, submissionId: req.params.id, userId: req.user?._id, body: req.body },
        "Error updating submission"
      );
      throw error;
    }
  }

  /**
   * Evaluate a submission
   * Admin only
   */
  async evaluateSubmission(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const submission = await submissionService.evaluateSubmission(id);
      sendSuccess(res, submission);
    } catch (error) {
      if (error instanceof Error && error.message === "Submission not found") {
        sendNotFound(res, "Submission not found");
        return;
      }
      logger.error({ error, submissionId: req.params.id }, "Error evaluating submission");
      throw error;
    }
  }

  /**
   * Re-evaluate all submissions for a match
   * Admin only
   */
  async evaluateMatchSubmissions(req: Request, res: Response): Promise<void> {
    try {
      const { matchId } = req.params;
      await submissionService.evaluateAllSubmissionsForMatch(matchId);
      sendSuccess(res, { message: "All submissions for match have been evaluated" });
    } catch (error) {
      if (error instanceof Error && error.message === "Match not found") {
        sendNotFound(res, "Match not found");
        return;
      }
      logger.error({ error, matchId: req.params.matchId }, "Error evaluating match submissions");
      throw error;
    }
  }
}

export const submissionController = new SubmissionController();
