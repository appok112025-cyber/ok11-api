import { Contest, IContest } from "./models/Contest.model.js";
import { ContestEntry } from "./models/ContestEntry.model.js";
import { Match } from "../matches/models/Match.model.js";
import {
  calculateSkip,
  createPaginatedResponse,
  PaginatedResult,
} from "../../shared/utils/pagination.js";
import mongoose from "mongoose";
import logger from "../../shared/config/logger.js";

export interface CreateContestDTO {
  matchId: string;
  name: string;
  firstPrize: number;
  entryFee: number;
  status?: string;
  isLocked?: boolean;
}

export class ContestService {
  /**
   * Get contests for a match with pagination
   */
  async getContestsByMatch(
    matchId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResult<IContest>> {
    const query = { matchId: new mongoose.Types.ObjectId(matchId) };
    const skip = calculateSkip(page, limit);

    const [contests, total] = await Promise.all([
      Contest.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Contest.countDocuments(query),
    ]);

    return createPaginatedResponse(contests, total, page, limit);
  }

  /**
   * Create a new contest
   */
  async createContest(data: CreateContestDTO): Promise<IContest> {
    const contest = new Contest({
      ...data,
      matchId: new mongoose.Types.ObjectId(data.matchId),
    });

    const savedContest = await contest.save();

    // Trigger push notification for new contest creation asynchronously
    try {
      // 1. Fetch match and populate team details for context
      const match = await Match.findById(data.matchId)
        .populate("teamA")
        .populate("teamB");

      let matchContext = "";
      if (match) {
        const teamAName = (match.teamA as any)?.name || "Team A";
        const teamBName = (match.teamB as any)?.name || "Team B";
        matchContext = ` for ${teamAName} vs ${teamBName}`;
      }

      // 2. Dynamically import notification service to avoid circular dependency
      const { notificationService } = await import("../notifications/notifications.service.js");

      // 3. Create a notification entry in the database
      const title = `New Contest: ${data.name}`;
      const body = `Join the new contest '${data.name}'${matchContext}! Entry Fee: ₹${data.entryFee}. First Prize: ₹${data.firstPrize}.`;
      const notification = await notificationService.createNotification({ title, body });

      // 4. Dispatch notification to all users subscribed to the general topic
      await notificationService.sendNotification(notification._id.toString());
      logger.info({ contestId: savedContest._id }, "Notification sent successfully for newly created contest");
    } catch (notificationError: any) {
      // Prevent notification dispatch errors from breaking/rolling back contest creation
      logger.error(
        { error: notificationError.message, contestId: savedContest._id },
        "Failed to send push notification for created contest"
      );
    }

    return savedContest;
  }

  /**
   * Get contest by ID
   */
  async getContestById(id: string): Promise<IContest | null> {
    return await Contest.findById(id);
  }

  /**
   * Update a contest
   */
  async updateContest(id: string, data: Partial<IContest>): Promise<IContest | null> {
    const existing = await Contest.findById(id);
    if (existing) {
      if (data.originalEntryFee !== undefined) {
        // Respect explicitly provided originalEntryFee (e.g. 0 to remove striking)
      } else if (data.entryFee === 0 && existing.entryFee > 0) {
        data.originalEntryFee = existing.entryFee;
      } else if (data.entryFee && data.entryFee > 0) {
        data.originalEntryFee = 0;
      }
    }
    return await Contest.findByIdAndUpdate(id, { $set: data }, { new: true });
  }

  /**
   * Join a contest
   */
  async joinContest(
    contestId: string,
    data: {
      userId: string;
      players: string[];
      captainId: string;
      viceCaptainId: string;
    }
  ): Promise<any> {
    const contest = await Contest.findById(contestId);
    if (!contest) {
      throw new Error("Contest not found");
    }

    if (contest.isLocked) {
      throw new Error("CONTEST_LOCKED");
    }

    // Check if contest is already full
    if (contest.participantLimit && contest.totalParticipants >= contest.participantLimit) {
      // Allow users who already joined to update their squad even if contest is full
      const userAlreadyJoined = await ContestEntry.findOne({
        contestId: new mongoose.Types.ObjectId(contestId),
        userId: new mongoose.Types.ObjectId(data.userId),
      });
      if (!userAlreadyJoined) {
        throw new Error("CONTEST_FULL");
      }
    }

    // Check if match is still upcoming
    const match = await Match.findById(contest.matchId);
    if (!match || match.status !== "Upcoming") {
      throw new Error("MATCH_ALREADY_STARTED");
    }

    // Check if user already joined
    const existingEntry = await ContestEntry.findOne({
      contestId: new mongoose.Types.ObjectId(contestId),
      userId: new mongoose.Types.ObjectId(data.userId),
    });

    if (existingEntry) {
      // UPDATE existing entry instead of throwing error
      existingEntry.players = data.players.map((id) => new mongoose.Types.ObjectId(id));
      existingEntry.captainId = new mongoose.Types.ObjectId(data.captainId);
      existingEntry.viceCaptainId = new mongoose.Types.ObjectId(data.viceCaptainId);
      await existingEntry.save();
      return existingEntry;
    }

    const entry = new ContestEntry({
      contestId: new mongoose.Types.ObjectId(contestId),
      userId: new mongoose.Types.ObjectId(data.userId),
      matchId: contest.matchId,
      players: data.players.map((id) => new mongoose.Types.ObjectId(id)),
      captainId: new mongoose.Types.ObjectId(data.captainId),
      viceCaptainId: new mongoose.Types.ObjectId(data.viceCaptainId),
    });

    await entry.save();

    // Increment participant count
    await Contest.findByIdAndUpdate(contestId, {
      $inc: { totalParticipants: 1 },
    });

    return entry;
  }

  /**
   * Get leaderboard for a contest
   */
  async getLeaderboard(contestId: string): Promise<any[]> {
    return await ContestEntry.find({
      contestId: new mongoose.Types.ObjectId(contestId),
    })
      .sort({ points: -1 })
      .populate("userId", "displayName photoURL email")
      .limit(100);
  }

  /**
   * Delete a contest and its entries
   */
  async deleteContest(id: string): Promise<boolean> {
    try {
      // Delete all entries for this contest
      await ContestEntry.deleteMany({ contestId: new mongoose.Types.ObjectId(id) });

      // Delete the contest
      const result = await Contest.findByIdAndDelete(id);

      return !!result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update player points for all entries in a contest
   */
  async updateContestPoints(
    contestId: string,
    playerPoints: Record<string, number>
  ): Promise<boolean> {
    try {
      // 1. Persist the points to the Match model so they can be retrieved for the form
      const contest = await Contest.findById(contestId);
      if (contest && contest.matchId) {
        await Match.findByIdAndUpdate(contest.matchId, {
          $set: { playerPoints: playerPoints }
        });
      }

      const entries = await ContestEntry.find({
        contestId: new mongoose.Types.ObjectId(contestId),
      });

      for (const entry of entries) {
        let totalPoints = 0;

        // Iterate over players and sum points
        for (const playerIdObj of entry.players) {
          const playerId = playerIdObj.toString();
          const basePoints = playerPoints[playerId] || 0;

          if (playerId === entry.captainId.toString()) {
            totalPoints += basePoints * 2; // Captain gets 2x
          } else if (playerId === entry.viceCaptainId.toString()) {
            totalPoints += basePoints * 1.5; // Vice-Captain gets 1.5x
          } else {
            totalPoints += basePoints;
          }
        }

        entry.points = totalPoints;
        await entry.save();
      }

      // Re-calculate ranks by sorting
      const sortedEntries = await ContestEntry.find({
        contestId: new mongoose.Types.ObjectId(contestId),
      }).sort({ points: -1, updatedAt: 1 });

      let currentRank = 1;
      let currentPoints = -1;
      let actualRank = 1;

      for (const entry of sortedEntries) {
        if (entry.points !== currentPoints) {
          currentRank = actualRank;
          currentPoints = entry.points;
        }
        entry.rank = currentRank;
        await entry.save();
        actualRank++;
      }

      return true;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all entries for a specific user in a match
   */
  async getUserEntries(matchId: string, userId: string): Promise<any[]> {
    return await ContestEntry.find({
      matchId: new mongoose.Types.ObjectId(matchId),
      userId: new mongoose.Types.ObjectId(userId),
    });
  }

  /**
   * Get all entries for a user across all matches
   */
  async getAllUserEntries(userId: string): Promise<any[]> {
    try {
      return await ContestEntry.find({
        userId: new mongoose.Types.ObjectId(userId),
      })
        .populate({
          path: "contestId",
          populate: {
            path: "matchId",
            populate: [
              { path: "teamA", select: "name imageUrl" },
              { path: "teamB", select: "name imageUrl" },
            ],
          },
        })
        .sort({ createdAt: -1 });
    } catch (error) {
      throw error;
    }
  }
}

export const contestService = new ContestService();
