import { Match, IMatch, MatchStatus } from "./models/Match.model.js";
import {
  calculateSkip,
  createPaginatedResponse,
  PaginatedResult,
} from "../../shared/utils/pagination.js";
import mongoose from "mongoose";
import logger from "../../shared/config/logger.js";

export interface IQuizOption {
  text: string;
}

export interface IMatchQuiz {
  questionId?: string;
  question: string;
  options: IQuizOption[];
  correctAnswer: number | null;
  points: number;
}

export interface CreateMatchDTO {
  matchNumber: number;
  matchName?: string;
  teamA: string;
  teamB: string;
  matchTime: Date;
  status?: MatchStatus;
  score?: string;
  players: {
    teamA: string[];
    teamB: string[];
  };
  quizzes?: IMatchQuiz[];
}

export interface UpdateMatchDTO {
  matchNumber?: number;
  matchName?: string;
  teamA?: string;
  teamB?: string;
  matchTime?: Date;
  status?: MatchStatus;
  score?: string;
  players?: {
    teamA?: string[];
    teamB?: string[];
  };
  quizzes?: IMatchQuiz[];
}

export interface MatchFilters {
  status?: MatchStatus;
}

export class MatchService {
  async createMatch(data: CreateMatchDTO): Promise<IMatch> {
    const match = new Match({
      matchNumber: data.matchNumber,
      matchName: data.matchName,
      teamA: data.teamA,
      teamB: data.teamB,
      matchTime: data.matchTime,
      status: data.status || "Upcoming",
      score: data.score,
      players: {
        teamA: data.players.teamA.map((id) => new mongoose.Types.ObjectId(id)),
        teamB: data.players.teamB.map((id) => new mongoose.Types.ObjectId(id)),
      },
      quizzes: data.quizzes || [],
    });

    const savedMatch = await match.save();

    // Populate team names for notification
    const populatedMatch = await Match.findById(savedMatch._id).populate("teamA").populate("teamB");

    const teamAName = (populatedMatch?.teamA as any)?.name || data.teamA;
    const teamBName = (populatedMatch?.teamB as any)?.name || data.teamB;
    const teamAImageUrl = (populatedMatch?.teamA as any)?.imageUrl;
    const teamBImageUrl = (populatedMatch?.teamB as any)?.imageUrl;

    try {
      const { fcmService } = await import("../../shared/services/fcm.service.js");
      await fcmService.sendNewMatchNotification(
        (savedMatch._id as any).toString(),
        teamAName,
        teamBName,
        data.matchNumber,
        teamAImageUrl,
        teamBImageUrl
      );
      logger.info(
        { matchId: (savedMatch._id as any).toString(), matchNumber: data.matchNumber },
        "New match notification sent"
      );
    } catch (error) {
      logger.error(
        { error, matchId: (savedMatch._id as any).toString() },
        "Failed to send new match notification"
      );
    }

    return savedMatch;
  }

  async updateMatch(matchId: string, data: UpdateMatchDTO): Promise<IMatch> {
    // Get current match to check if status is changing
    const currentMatch = await Match.findById(matchId).populate("teamA").populate("teamB");
    if (!currentMatch) {
      throw new Error("Match not found");
    }

    const isChangingToLive = data.status === "Live" && currentMatch.status !== "Live";
    const isChangingToCompleted =
      data.status === "Completed" && currentMatch.status !== "Completed";

    const updateData: any = {};

    if (data.matchNumber !== undefined) updateData.matchNumber = data.matchNumber;
    if (data.matchName !== undefined) {
      updateData.matchName = data.matchName.trim() || undefined;
    }
    if (data.teamA !== undefined) updateData.teamA = data.teamA;
    if (data.teamB !== undefined) updateData.teamB = data.teamB;
    if (data.matchTime !== undefined) {
      updateData.matchTime = data.matchTime;
    }
    if (data.status !== undefined) updateData.status = data.status;
    if (data.score !== undefined) updateData.score = data.score;
    if (data.quizzes !== undefined) {
      updateData.quizzes = data.quizzes;
      logger.info({ matchId, quizzesCount: data.quizzes.length }, "Updating match with quizzes");
    }
    if (data.players !== undefined) {
      // Use nested object update to avoid MongoDB conflict
      if (data.players.teamA !== undefined && data.players.teamB !== undefined) {
        // Update both teams together
        updateData.players = {
          teamA: data.players.teamA.map((id) => new mongoose.Types.ObjectId(id)),
          teamB: data.players.teamB.map((id) => new mongoose.Types.ObjectId(id)),
        };
      } else {
        // Update individual teams using dot notation
        if (data.players.teamA !== undefined) {
          updateData["players.teamA"] = data.players.teamA.map(
            (id) => new mongoose.Types.ObjectId(id)
          );
        }
        if (data.players.teamB !== undefined) {
          updateData["players.teamB"] = data.players.teamB.map(
            (id) => new mongoose.Types.ObjectId(id)
          );
        }
      }
    }

    const match = await Match.findByIdAndUpdate(matchId, updateData, {
      new: true,
      runValidators: true,
    });

    if (!match) {
      throw new Error("Match not found");
    }

    // Get team names and images for notifications
    const teamAName = (currentMatch.teamA as any)?.name || "Team A";
    const teamBName = (currentMatch.teamB as any)?.name || "Team B";
    const teamAImageUrl = (currentMatch.teamA as any)?.imageUrl;
    const teamBImageUrl = (currentMatch.teamB as any)?.imageUrl;

    // Send notifications based on status change
    try {
      const { fcmService } = await import("../../shared/services/fcm.service.js");

      // If status changed to Live, send live notification
      if (isChangingToLive) {
        logger.info({ matchId }, "Match status changed to Live, sending notification");
        await fcmService.sendMatchLiveNotification(
          matchId,
          teamAName,
          teamBName,
          teamAImageUrl,
          teamBImageUrl
        );
      }

      // If status changed to Completed, evaluate submissions and send result notification
      if (isChangingToCompleted) {
        logger.info({ matchId }, "Match status changed to Completed, evaluating all submissions");
        try {
          const { submissionService } = await import("../submissions/submissions.service.js");
          await submissionService.evaluateAllSubmissionsForMatch(matchId);
          logger.info({ matchId }, "All submissions evaluated successfully");
        } catch (error) {
          logger.error({ error, matchId }, "Failed to evaluate submissions for match");
        }

        // Send result notification to users who submitted
        await fcmService.sendMatchResultNotification(
          matchId,
          teamAName,
          teamBName,
          data.score,
          teamAImageUrl,
          teamBImageUrl
        );
        logger.info({ matchId }, "Match result notification sent");
      }

      // Always send silent data notification to trigger app refresh
      await fcmService.sendSilentMatchUpdate(matchId);
      logger.info({ matchId }, "Silent match update notification sent for app refresh");
    } catch (error) {
      logger.error({ error, matchId }, "Failed to send match status notification");
    }

    logger.info(
      {
        matchId,
        quizzesInResponse: match.quizzes?.length,
        quizzes: match.quizzes,
      },
      "Match updated, returning response"
    );

    return match;
  }

  async deleteMatch(matchId: string): Promise<void> {
    const result = await Match.findByIdAndDelete(matchId);
    if (!result) {
      throw new Error("Match not found");
    }
  }

  async getMatchById(matchId: string): Promise<IMatch | null> {
    return await Match.findById(matchId)
      .populate("teamA")
      .populate("teamB")
      .populate("players.teamA")
      .populate("players.teamB");
  }

  async getAllMatches(
    filters: MatchFilters,
    page: number,
    limit: number
  ): Promise<PaginatedResult<IMatch>> {
    const query: any = {};

    if (filters.status) {
      query.status = filters.status;
    }

    const skip = calculateSkip(page, limit);

    const [matches, total] = await Promise.all([
      Match.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("teamA")
        .populate("teamB")
        .populate("players.teamA")
        .populate("players.teamB"),
      Match.countDocuments(query),
    ]);

    return createPaginatedResponse(matches, total, page, limit);
  }

  async getUpcomingMatches(): Promise<IMatch[]> {
    return await Match.find({ status: "Upcoming" })
      .sort({ matchTime: 1 })
      .populate("teamA")
      .populate("teamB")
      .populate("players.teamA")
      .populate("players.teamB");
  }

  async getLiveMatches(): Promise<IMatch[]> {
    return await Match.find({ status: "Live" })
      .sort({ matchTime: 1 })
      .populate("teamA")
      .populate("teamB")
      .populate("players.teamA")
      .populate("players.teamB");
  }
}

export const matchService = new MatchService();
