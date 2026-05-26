import { Request, Response } from "express";
import { userService } from "./users.service.js";
import { sendSuccess, sendNotFound } from "../../shared/utils/response.js";
import logger from "../../shared/config/logger.js";

export class UserController {
  /**
   * Get all users with pagination and search
   * Admin only
   */
  async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      // Use validatedQuery if available (from validation middleware), otherwise fall back to req.query
      const query = (req as any).validatedQuery || req.query;
      const { page, limit, search } = query as {
        page?: number;
        limit?: number;
        search?: string;
      };

      const result = await userService.getAllUsers(page || 1, limit || 10, search);

      sendSuccess(res, result);
    } catch (error) {
      logger.error({ error, query: req.query }, "Error fetching users");
      throw error;
    }
  }

  /**
   * Get user by ID
   * Admin only
   */
  async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = await userService.getUserById(id);

      if (!user) {
        sendNotFound(res, "User not found");
        return;
      }

      sendSuccess(res, user);
    } catch (error) {
      logger.error({ error, userId: req.params.id }, "Error fetching user");
      throw error;
    }
  }

  /**
   * Block a user
   * Admin only
   */
  async blockUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = await userService.blockUser(id);
      sendSuccess(res, user);
    } catch (error) {
      if (error instanceof Error && error.message === "User not found") {
        sendNotFound(res, "User not found");
        return;
      }
      logger.error({ error, userId: req.params.id }, "Error blocking user");
      throw error;
    }
  }

  /**
   * Unblock a user
   * Admin only
   */
  async unblockUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = await userService.unblockUser(id);
      sendSuccess(res, user);
    } catch (error) {
      if (error instanceof Error && error.message === "User not found") {
        sendNotFound(res, "User not found");
        return;
      }
      logger.error({ error, userId: req.params.id }, "Error unblocking user");
      throw error;
    }
  }

  /**
   * Get user statistics
   * Admin only
   */
  async getUserStats(_req: Request, res: Response): Promise<void> {
    try {
      const stats = await userService.getUserStats();
      sendSuccess(res, stats);
    } catch (error) {
      logger.error({ error }, "Error fetching user stats");
      throw error;
    }
  }

  /**
   * Add money to user's wallet
   * Admin only
   */
  async addMoney(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { amount } = req.body;
      if (typeof amount !== "number" || amount <= 0) {
        res.status(400).json({ success: false, message: "Invalid amount" });
        return;
      }
      const user = await userService.addMoney(id, amount);
      sendSuccess(res, user);
    } catch (error) {
      if (error instanceof Error && error.message === "User not found") {
        sendNotFound(res, "User not found");
        return;
      }
      logger.error({ error, userId: req.params.id }, "Error adding money to user");
      throw error;
    }
  }
}

export const userController = new UserController();
