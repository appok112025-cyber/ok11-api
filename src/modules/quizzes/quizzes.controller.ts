import { Request, Response } from "express";
import { quizService } from "./quizzes.service.js";
import {
  sendSuccess,
  sendCreated,
  sendNotFound,
  sendNoContent,
} from "../../shared/utils/response.js";
import logger from "../../shared/config/logger.js";

export class QuizController {
  /**
   * Get all quizzes
   * Admin only
   */
  async getAllQuizzes(req: Request, res: Response): Promise<void> {
    try {
      const { search } = req.query;
      const quizzes = await quizService.getAllQuizzes(search as string);
      sendSuccess(res, quizzes);
    } catch (error) {
      logger.error({ error }, "Error fetching all quizzes");
      throw error;
    }
  }

  /**
   * Get quizzes for a specific match
   * User or Admin access
   * Note: correctAnswer is hidden for users, shown for admins
   */
  async getQuizzesByMatch(req: Request, res: Response): Promise<void> {
    try {
      const { matchId } = req.params;
      const quizzes = await quizService.getQuizzesByMatch(matchId);

      // Check if request is from admin or user
      const isAdmin = !!req.admin;

      // Hide correctAnswer for users
      const responseQuizzes = quizzes.map((quiz) => {
        const quizObj = quiz.toObject();
        if (!isAdmin) {
          delete quizObj.correctAnswer;
        }
        return quizObj;
      });

      sendSuccess(res, responseQuizzes);
    } catch (error) {
      logger.error({ error, matchId: req.params.matchId }, "Error fetching quizzes by match");
      throw error;
    }
  }

  /**
   * Create a new quiz
   * Admin only
   */
  async createQuiz(req: Request, res: Response): Promise<void> {
    try {
      const quizData = req.body;
      const quiz = await quizService.createQuiz(quizData);
      sendCreated(res, quiz);
    } catch (error) {
      logger.error({ error, body: req.body }, "Error creating quiz");
      throw error;
    }
  }

  /**
   * Update a quiz
   * Admin only
   */
  async updateQuiz(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const quiz = await quizService.updateQuiz(id, updateData);
      sendSuccess(res, quiz);
    } catch (error) {
      if (error instanceof Error && error.message === "Quiz not found") {
        sendNotFound(res, "Quiz not found");
        return;
      }
      logger.error({ error, quizId: req.params.id, body: req.body }, "Error updating quiz");
      throw error;
    }
  }

  /**
   * Delete a quiz
   * Admin only
   */
  async deleteQuiz(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await quizService.deleteQuiz(id);
      sendNoContent(res);
    } catch (error) {
      if (error instanceof Error && error.message === "Quiz not found") {
        sendNotFound(res, "Quiz not found");
        return;
      }
      logger.error({ error, quizId: req.params.id }, "Error deleting quiz");
      throw error;
    }
  }
}

export const quizController = new QuizController();
