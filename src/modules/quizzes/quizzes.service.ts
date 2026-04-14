import { Quiz, IQuiz } from "./models/Quiz.model.js";
import logger from "../../shared/config/logger.js";

export interface CreateQuizDTO {
  question: string;
}

export interface UpdateQuizDTO {
  question?: string;
}

export class QuizService {
  /**
   * Get all quizzes
   */
  async getAllQuizzes(search?: string): Promise<IQuiz[]> {
    try {
      const filter: any = {};

      if (search) {
        filter.question = { $regex: search, $options: "i" };
      }

      const quizzes = await Quiz.find(filter).sort({ createdAt: -1 });
      return quizzes;
    } catch (error) {
      logger.error({ error }, "Error fetching all quizzes");
      throw error;
    }
  }

  /**
   * Create a new quiz
   */
  async createQuiz(data: CreateQuizDTO): Promise<IQuiz> {
    try {
      const quiz = new Quiz(data);
      await quiz.save();
      logger.info({ quizId: quiz._id }, "Quiz created successfully");
      return quiz;
    } catch (error) {
      logger.error({ error, data }, "Error creating quiz");
      throw error;
    }
  }

  /**
   * Update a quiz
   */
  async updateQuiz(quizId: string, data: UpdateQuizDTO): Promise<IQuiz> {
    try {
      const quiz = await Quiz.findByIdAndUpdate(
        quizId,
        { $set: data },
        { new: true, runValidators: true }
      );

      if (!quiz) {
        throw new Error("Quiz not found");
      }

      logger.info({ quizId }, "Quiz updated successfully");
      return quiz;
    } catch (error) {
      logger.error({ error, quizId, data }, "Error updating quiz");
      throw error;
    }
  }

  /**
   * Delete a quiz
   */
  async deleteQuiz(quizId: string): Promise<void> {
    try {
      const quiz = await Quiz.findByIdAndDelete(quizId);

      if (!quiz) {
        throw new Error("Quiz not found");
      }

      logger.info({ quizId }, "Quiz deleted successfully");
    } catch (error) {
      logger.error({ error, quizId }, "Error deleting quiz");
      throw error;
    }
  }

  /**
   * Get quiz by ID
   */
  async getQuizById(quizId: string): Promise<IQuiz | null> {
    try {
      const quiz = await Quiz.findById(quizId);
      return quiz;
    } catch (error) {
      logger.error({ error, quizId }, "Error fetching quiz by ID");
      throw error;
    }
  }

  /**
   * Get all quizzes for a specific match
   */
  async getQuizzesByMatch(matchId: string): Promise<IQuiz[]> {
    try {
      const quizzes = await Quiz.find({ matchId }).sort({ createdAt: 1 });
      return quizzes;
    } catch (error) {
      logger.error({ error, matchId }, "Error fetching quizzes by match");
      throw error;
    }
  }
}

export const quizService = new QuizService();
