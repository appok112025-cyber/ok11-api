import { Request, Response } from "express";
import { playerService } from "./players.service.js";
import { sendSuccess, sendCreated, sendNotFound, sendNoContent } from "shared/utils/response.js";
import logger from "shared/config/logger.js";

export class PlayerController {
  /**
   * Get all players
   * Public endpoint
   */
  async getAllPlayers(req: Request, res: Response): Promise<void> {
    try {
      const { search, page, limit } = req.query;
      const result = await playerService.getAllPlayers(
        search as string,
        page ? parseInt(page as string) : 1,
        limit ? parseInt(limit as string) : 50
      );
      sendSuccess(res, result);
    } catch (error) {
      logger.error({ error }, "Error fetching players");
      throw error;
    }
  }

  /**
   * Create a new player
   * Admin only
   */
  async createPlayer(req: Request, res: Response): Promise<void> {
    try {
      const playerData = req.body;
      const player = await playerService.createPlayer(playerData);
      sendCreated(res, player);
    } catch (error) {
      logger.error({ error, body: req.body }, "Error creating player");
      throw error;
    }
  }

  /**
   * Update a player
   * Admin only
   */
  async updatePlayer(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const player = await playerService.updatePlayer(id, updateData);
      sendSuccess(res, player);
    } catch (error) {
      if (error instanceof Error && error.message === "Player not found") {
        sendNotFound(res, "Player not found");
        return;
      }
      logger.error({ error, playerId: req.params.id, body: req.body }, "Error updating player");
      throw error;
    }
  }

  /**
   * Delete a player
   * Admin only
   */
  async deletePlayer(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await playerService.deletePlayer(id);
      sendNoContent(res);
    } catch (error) {
      if (error instanceof Error && error.message === "Player not found") {
        sendNotFound(res, "Player not found");
        return;
      }
      logger.error({ error, playerId: req.params.id }, "Error deleting player");
      throw error;
    }
  }
}

export const playerController = new PlayerController();
