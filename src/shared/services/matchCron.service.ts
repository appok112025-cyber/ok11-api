import cron from "node-cron";
import { Match } from "../../modules/matches/models/Match.model.js";
import { matchService } from "../../modules/matches/matches.service.js";
import { fcmService } from "./fcm.service.js";
import logger from "../config/logger.js";

class MatchCronService {
  private isRunning = false;
  private notificationSentMatches = new Set<string>();    // 30-min reminder sent
  private isProcessing = false;

  /**
   * Get current IST time as Date object
   * matchTime is stored in UTC, but represents IST time
   */
  private getCurrentIST(): Date {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const utcTime = now.getTime();
    const istTime = new Date(utcTime + istOffset);
    return istTime;
  }

  /**
   * Convert IST time to UTC (for database queries)
   * Since matchTime is stored as UTC but represents IST, we need to subtract IST offset
   */
  private istToUTC(istTime: Date): Date {
    const istOffset = 5.5 * 60 * 60 * 1000;
    return new Date(istTime.getTime() - istOffset);
  }

  /**
   * Check and send 30-minute and 15-minute reminder notifications
   */
  private async checkAndSendReminders(): Promise<void> {
    try {
      const nowIST = this.getCurrentIST();
      const thirtyMinutesFromNowIST = new Date(nowIST.getTime() + 30 * 60 * 1000);

      // Fetch matches starting within the next 30 minutes
      const upcomingMatches = await Match.find({
        status: "Upcoming",
        matchTime: {
          $gte: this.istToUTC(nowIST),
          $lte: this.istToUTC(thirtyMinutesFromNowIST),
        },
      })
        .populate("teamA")
        .populate("teamB");

      for (const match of upcomingMatches) {
        const matchId = (match._id as any).toString();

        const matchISTTime = new Date(match.matchTime.getTime() + 5.5 * 60 * 60 * 1000);
        const timeUntilMatch = matchISTTime.getTime() - nowIST.getTime();
        const minutesUntilMatch = Math.floor(timeUntilMatch / (60 * 1000));

        const teamAName = (match.teamA as any)?.name || "Team A";
        const teamBName = (match.teamB as any)?.name || "Team B";
        const teamAImageUrl = (match.teamA as any)?.imageUrl;
        const teamBImageUrl = (match.teamB as any)?.imageUrl;

        // --- First reminder: 15-30 minutes before ---
        if (
          minutesUntilMatch <= 30 &&
          minutesUntilMatch > 15 &&
          !match.notification30Sent
        ) {
          await fcmService.sendMatchReminderNotification(
            matchId,
            teamAName,
            teamBName,
            teamAImageUrl,
            teamBImageUrl
          );

          await Match.updateOne({ _id: match._id }, { $set: { notification30Sent: true } });
          logger.info(
            { matchId, matchNumber: match.matchNumber, minutesUntilMatch },
            "30-minute match reminder sent to general topic"
          );
        }


      }
    } catch (error) {
      logger.error({ error }, "Error checking and sending match reminders");
    }
  }

  /**
   * Check and update match status to Live
   * Uses wider window (5 minutes) to catch up after missed executions
   */
  private async checkAndUpdateMatchStatus(): Promise<void> {
    try {
      const nowIST = this.getCurrentIST();
      const twoMinutesFromNowIST = new Date(nowIST.getTime() + 2 * 60 * 1000);

      const matchesToUpdate = await Match.find({
        status: "Upcoming",
        matchTime: {
          $lte: this.istToUTC(twoMinutesFromNowIST),
        },
      })
        .populate("teamA")
        .populate("teamB");

      for (const match of matchesToUpdate) {
        const matchId = (match._id as any).toString();

        // Update status to Live (this will also send the live notification via matchService)
        await matchService.updateMatch(matchId, { status: "Live" });

        this.notificationSentMatches.delete(matchId);
        logger.info(
          { matchId: matchId, matchNumber: match.matchNumber },
          "Match status updated to Live"
        );
      }
    } catch (error) {
      logger.error({ error }, "Error checking and updating match status");
    }
  }

  /**
   * Clean up old notification tracking (matches that are completed or cancelled)
   */
  private async cleanupNotificationTracking(): Promise<void> {
    try {
      const completedOrCancelled = await Match.find({
        status: { $in: ["Completed", "Cancelled"] },
      }).select("_id");

      const idsToRemove = completedOrCancelled.map((m) => (m._id as any).toString());
      idsToRemove.forEach((id) => {
        this.notificationSentMatches.delete(id);
      });

      if (idsToRemove.length > 0) {
        logger.info(
          { count: idsToRemove.length },
          "Cleaned up notification tracking for completed/cancelled matches"
        );
      }
    } catch (error) {
      logger.error({ error }, "Error cleaning up notification tracking");
    }
  }

  /**
   * Start the cron jobs
   */
  start(): void {
    if (this.isRunning) {
      logger.warn("Match cron jobs already running");
      return;
    }

    logger.info("Starting match cron jobs...");

    cron.schedule("* * * * *", () => {
      if (this.isProcessing) {
        logger.warn("Previous cron execution still running, skipping this cycle");
        return;
      }

      setImmediate(async () => {
        this.isProcessing = true;
        const startTime = Date.now();

        try {
          await Promise.all([this.checkAndSendReminders(), this.checkAndUpdateMatchStatus()]);
        } catch (error) {
          logger.error({ error }, "Error in cron job execution");
        } finally {
          this.isProcessing = false;
          const duration = Date.now() - startTime;
          if (duration > 5000) {
            logger.warn({ duration }, "Cron job took longer than 5 seconds");
          }
        }
      });
    });

    cron.schedule("0 * * * *", () => {
      setImmediate(async () => {
        try {
          await this.cleanupNotificationTracking();
        } catch (error) {
          logger.error({ error }, "Error in cleanup cron job");
        }
      });
    });

    this.isRunning = true;
    logger.info("Match cron jobs started successfully");
  }

  /**
   * Stop the cron jobs
   */
  stop(): void {
    this.isRunning = false;
    this.notificationSentMatches.clear();
    logger.info("Match cron jobs stopped");
  }
}

export const matchCronService = new MatchCronService();
