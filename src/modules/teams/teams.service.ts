import { Team, ITeam } from "./models/Team.model.js";
import logger from "../../shared/config/logger.js";

export interface CreateTeamDTO {
  name: string;
  imageUrl: string;
}

export interface UpdateTeamDTO {
  name?: string;
  imageUrl?: string;
}

class TeamService {
  /**
   * Create a new team
   */
  async createTeam(data: CreateTeamDTO): Promise<ITeam> {
    try {
      const team = new Team(data);
      await team.save();
      logger.info({ teamId: team._id, name: team.name }, "Team created successfully");
      return team;
    } catch (error) {
      logger.error({ error, data }, "Error creating team");
      throw error;
    }
  }

  /**
   * Update an existing team
   */
  async updateTeam(teamId: string, data: UpdateTeamDTO): Promise<ITeam> {
    try {
      const team = await Team.findByIdAndUpdate(
        teamId,
        { $set: data },
        { new: true, runValidators: true }
      );

      if (!team) {
        throw new Error("Team not found");
      }

      logger.info({ teamId, updates: data }, "Team updated successfully");
      return team;
    } catch (error) {
      logger.error({ error, teamId, data }, "Error updating team");
      throw error;
    }
  }

  /**
   * Delete a team
   */
  async deleteTeam(teamId: string): Promise<void> {
    try {
      const team = await Team.findByIdAndDelete(teamId);

      if (!team) {
        throw new Error("Team not found");
      }

      logger.info({ teamId }, "Team deleted successfully");
    } catch (error) {
      logger.error({ error, teamId }, "Error deleting team");
      throw error;
    }
  }

  /**
   * Get team by ID
   */
  async getTeamById(teamId: string): Promise<ITeam | null> {
    try {
      const team = await Team.findById(teamId);
      return team;
    } catch (error) {
      logger.error({ error, teamId }, "Error fetching team by ID");
      throw error;
    }
  }

  /**
   * Get all teams
   */
  async getAllTeams(search?: string): Promise<ITeam[]> {
    try {
      const filter: any = {};

      if (search) {
        filter.name = { $regex: search, $options: "i" };
      }

      const teams = await Team.find(filter).sort({ name: 1 });
      return teams;
    } catch (error) {
      logger.error({ error }, "Error fetching all teams");
      throw error;
    }
  }
}

export const teamService = new TeamService();
