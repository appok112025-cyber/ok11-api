import { Request, Response } from "express";
import { teamService } from "./teams.service.js";
import {
  sendSuccess,
  sendCreated,
  sendNotFound,
  sendNoContent,
  sendBadRequest,
} from "../../shared/utils/response.js";
import logger from "../../shared/config/logger.js";
import { uploadService } from "../upload/upload.service.js";

export class TeamController {
  /**
   * Get all teams
   * Public endpoint
   */
  async getAllTeams(req: Request, res: Response): Promise<void> {
    try {
      const { search } = req.query;
      const teams = await teamService.getAllTeams(search as string);
      sendSuccess(res, teams);
    } catch (error) {
      logger.error({ error }, "Error fetching teams");
      throw error;
    }
  }

  /**
   * Get team by ID
   * Public endpoint
   */
  async getTeamById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const team = await teamService.getTeamById(id);

      if (!team) {
        sendNotFound(res, "Team not found");
        return;
      }

      sendSuccess(res, team);
    } catch (error) {
      logger.error({ error, teamId: req.params.id }, "Error fetching team");
      throw error;
    }
  }

  /**
   * Create a new team
   * Admin only
   */
  async createTeam(req: Request, res: Response): Promise<void> {
    try {
      const teamData = req.body;
      const team = await teamService.createTeam(teamData);
      sendCreated(res, team);
    } catch (error) {
      logger.error({ error, body: req.body }, "Error creating team");
      throw error;
    }
  }

  /**
   * Update a team
   * Admin only
   */
  async updateTeam(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const team = await teamService.updateTeam(id, updateData);
      sendSuccess(res, team);
    } catch (error) {
      if (error instanceof Error && error.message === "Team not found") {
        sendNotFound(res, "Team not found");
        return;
      }
      logger.error({ error, teamId: req.params.id, body: req.body }, "Error updating team");
      throw error;
    }
  }

  /**
   * Delete a team
   * Admin only
   */
  async deleteTeam(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await teamService.deleteTeam(id);
      sendNoContent(res);
    } catch (error) {
      if (error instanceof Error && error.message === "Team not found") {
        sendNotFound(res, "Team not found");
        return;
      }
      logger.error({ error, teamId: req.params.id }, "Error deleting team");
      throw error;
    }
  }

  async getTeamImageUploadUrl(req: Request, res: Response): Promise<void> {
    try {
      const { contentType, fileName, fileSize, path } = req.body as {
        contentType?: string;
        fileName?: string;
        fileSize?: number;
        path?: string;
      };

      if (!contentType || typeof contentType !== "string") {
        sendBadRequest(res, "contentType is required");
        return;
      }

      if (!fileName || typeof fileName !== "string") {
        sendBadRequest(res, "fileName is required");
        return;
      }

      if (!fileSize || typeof fileSize !== "number") {
        sendBadRequest(res, "fileSize is required");
        return;
      }

      const result = await uploadService.generatePresignedUploadUrl(
        fileName,
        contentType,
        fileSize,
        path && typeof path === "string" && path.trim() ? path.trim() : "teams"
      );

      sendSuccess(res, result);
    } catch (error) {
      logger.error({ error }, "Error generating team image upload URL");
      throw error;
    }
  }
}

export const teamController = new TeamController();
