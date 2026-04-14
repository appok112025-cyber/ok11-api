import { Submission, ISubmission, IQuizAnswer } from "./models/Submission.model.js";
import { Match } from "modules/matches/models/Match.model.js";
import { Quiz, IQuiz } from "modules/quizzes/models/Quiz.model.js";
import {
  calculateSkip,
  createPaginatedResponse,
  PaginatedResult,
} from "../../shared/utils/pagination.js";
import mongoose from "mongoose";
import logger from "../../shared/config/logger.js";

export interface CreateSubmissionDTO {
  userId: string;
  matchId: string;
  teamASelectedPlayers: string[];
  teamBSelectedPlayers: string[];
  quizAnswers: Array<{
    quizId: string;
    selectedOption: number;
  }>;
}

export interface UpdateSubmissionDTO {
  teamASelectedPlayers?: string[];
  teamBSelectedPlayers?: string[];
  quizAnswers?: Array<{
    quizId: string;
    selectedOption: number;
  }>;
}

export class SubmissionService {
  /**
   * Create a new submission
   * Validates deadline and checks for existing submission
   */
  async createSubmission(data: CreateSubmissionDTO): Promise<ISubmission> {
    // Get match to check deadline
    const match = await Match.findById(data.matchId);
    if (!match) {
      throw new Error("Match not found");
    }

    // Check if matchTime has passed
    const now = new Date();
    if (now >= match.matchTime) {
      throw new Error("Submission deadline has passed");
    }

    // Check if match status allows submissions
    if (match.status !== "Upcoming") {
      throw new Error("Submissions are only allowed for upcoming matches");
    }

    // Use userId from request body
    const submissionUserId = data.userId;

    // Check if user already has a submission for this match
    const existingSubmission = await Submission.findOne({
      userId: new mongoose.Types.ObjectId(submissionUserId),
      matchId: new mongoose.Types.ObjectId(data.matchId),
    });

    if (existingSubmission) {
      throw new Error("You have already submitted for this match");
    }

    // Get quizzes to calculate total points
    const quizzes = await Quiz.find({ matchId: data.matchId });
    const totalPoints = quizzes.reduce((sum, quiz: any) => sum + (quiz.points || 0), 0);

    // Create quiz answers with default values
    const quizAnswers: IQuizAnswer[] = data.quizAnswers.map((answer) => ({
      quizId: new mongoose.Types.ObjectId(answer.quizId),
      selectedOption: answer.selectedOption,
      isCorrect: false,
      pointsEarned: 0,
    }));

    // Convert player IDs to ObjectIds
    const teamASelectedPlayers = data.teamASelectedPlayers.map(
      (playerId) => new mongoose.Types.ObjectId(playerId)
    );
    const teamBSelectedPlayers = data.teamBSelectedPlayers.map(
      (playerId) => new mongoose.Types.ObjectId(playerId)
    );

    // Create submission
    const submission = new Submission({
      userId: new mongoose.Types.ObjectId(submissionUserId),
      matchId: new mongoose.Types.ObjectId(data.matchId),
      teamASelectedPlayers,
      teamBSelectedPlayers,
      quizAnswers,
      totalPoints,
      totalPointsEarned: 0,
      status: "pending",
      submittedAt: new Date(),
    });

    const savedSubmission = await submission.save();

    await Match.findByIdAndUpdate(data.matchId, {
      $inc: { participantsCount: 1 },
    });

    const populated = await Submission.findById(savedSubmission._id)
      .populate({
        path: "matchId",
        populate: [
          { path: "teamA" },
          { path: "teamB" },
          { path: "players.teamA" },
          { path: "players.teamB" },
        ],
      })
      .populate("teamASelectedPlayers")
      .populate("teamBSelectedPlayers")
      .populate("quizAnswers.quizId");

    if (!populated) {
      throw new Error("Failed to retrieve saved submission");
    }

    return populated;
  }

  /**
   * Update an existing submission
   * Validates deadline, match status, and ownership
   */
  async updateSubmission(
    submissionId: string,
    userId: string,
    data: UpdateSubmissionDTO
  ): Promise<ISubmission> {
    // Get submission
    const submission = await Submission.findById(submissionId);
    if (!submission) {
      throw new Error("Submission not found");
    }

    // Verify ownership
    if (submission.userId.toString() !== userId) {
      throw new Error("You can only update your own submissions");
    }

    // Get match to check deadline
    const match = await Match.findById(submission.matchId);
    if (!match) {
      throw new Error("Match not found");
    }

    // Check if matchTime has passed
    const now = new Date();
    if (now >= match.matchTime) {
      throw new Error("Submission deadline has passed");
    }

    // Check if match status allows updates
    if (match.status !== "Upcoming") {
      throw new Error("Submissions can only be updated for upcoming matches");
    }

    // Update fields
    if (data.teamASelectedPlayers) {
      submission.teamASelectedPlayers = data.teamASelectedPlayers.map(
        (playerId) => new mongoose.Types.ObjectId(playerId)
      );
    }

    if (data.teamBSelectedPlayers) {
      submission.teamBSelectedPlayers = data.teamBSelectedPlayers.map(
        (playerId) => new mongoose.Types.ObjectId(playerId)
      );
    }

    if (data.quizAnswers) {
      submission.quizAnswers = data.quizAnswers.map((answer) => ({
        quizId: new mongoose.Types.ObjectId(answer.quizId),
        selectedOption: answer.selectedOption,
        isCorrect: false,
        pointsEarned: 0,
      }));
    }

    const savedSubmission = await submission.save();

    const populated = await Submission.findById(savedSubmission._id)
      .populate({
        path: "matchId",
        populate: [
          { path: "teamA" },
          { path: "teamB" },
          { path: "players.teamA" },
          { path: "players.teamB" },
        ],
      })
      .populate("teamASelectedPlayers")
      .populate("teamBSelectedPlayers")
      .populate("quizAnswers.quizId");

    if (!populated) {
      throw new Error("Failed to retrieve saved submission");
    }

    return populated;
  }

  /**
   * Get submission by ID
   */
  async getSubmissionById(submissionId: string): Promise<ISubmission | null> {
    return await Submission.findById(submissionId)
      .populate("userId", "email displayName")
      .populate({
        path: "matchId",
        populate: [
          { path: "teamA" },
          { path: "teamB" },
          { path: "players.teamA" },
          { path: "players.teamB" },
        ],
      })
      .populate("teamASelectedPlayers")
      .populate("teamBSelectedPlayers")
      .populate("quizAnswers.quizId");
  }

  /**
   * Get submissions by user with pagination
   */
  async getSubmissionsByUser(
    userId: string,
    page: number,
    limit: number
  ): Promise<PaginatedResult<ISubmission>> {
    const query = { userId: new mongoose.Types.ObjectId(userId) };
    const skip = calculateSkip(page, limit);

    const [submissions, total] = await Promise.all([
      Submission.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({
          path: "matchId",
          populate: [
            { path: "teamA" },
            { path: "teamB" },
            { path: "players.teamA" },
            { path: "players.teamB" },
          ],
        })
        .populate("teamASelectedPlayers")
        .populate("teamBSelectedPlayers")
        .populate("quizAnswers.quizId"),
      Submission.countDocuments(query),
    ]);

    return createPaginatedResponse(submissions, total, page, limit);
  }

  /**
   * Get submissions by match with pagination
   */
  async getSubmissionsByMatch(
    matchId: string,
    page: number,
    limit: number
  ): Promise<PaginatedResult<ISubmission>> {
    const query = { matchId: new mongoose.Types.ObjectId(matchId) };
    const skip = calculateSkip(page, limit);

    const [submissions, total] = await Promise.all([
      Submission.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("userId", "email displayName")
        .populate({
          path: "matchId",
          populate: [
            { path: "teamA" },
            { path: "teamB" },
            { path: "players.teamA" },
            { path: "players.teamB" },
          ],
        })
        .populate("teamASelectedPlayers")
        .populate("teamBSelectedPlayers")
        .populate("quizAnswers.quizId"),
      Submission.countDocuments(query),
    ]);

    return createPaginatedResponse(submissions, total, page, limit);
  }

  /**
   * Get all submissions with optional filters and pagination
   */
  async getAllSubmissions(
    filters?: {
      userId?: string;
      matchId?: string;
      status?: string;
    },
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResult<ISubmission>> {
    const query: any = {};

    if (filters?.userId) {
      query.userId = new mongoose.Types.ObjectId(filters.userId);
    }

    if (filters?.matchId) {
      query.matchId = new mongoose.Types.ObjectId(filters.matchId);
    }

    if (filters?.status) {
      query.status = filters.status;
    }

    const skip = calculateSkip(page, limit);

    const [submissions, total] = await Promise.all([
      Submission.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("userId", "email displayName")
        .populate({
          path: "matchId",
          populate: [
            { path: "teamA" },
            { path: "teamB" },
            { path: "players.teamA" },
            { path: "players.teamB" },
          ],
        })
        .populate("teamASelectedPlayers")
        .populate("teamBSelectedPlayers")
        .populate("quizAnswers.quizId"),
      Submission.countDocuments(query),
    ]);

    return createPaginatedResponse(submissions, total, page, limit);
  }

  /**
   * Get user's submission for a specific match
   */
  async getUserSubmissionForMatch(userId: string, matchId: string): Promise<ISubmission | null> {
    const submission = await Submission.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      matchId: new mongoose.Types.ObjectId(matchId),
    })
      .populate({
        path: "matchId",
        populate: [
          { path: "teamA" },
          { path: "teamB" },
          { path: "players.teamA" },
          { path: "players.teamB" },
        ],
      })
      .populate("teamASelectedPlayers")
      .populate("teamBSelectedPlayers")
      .populate("quizAnswers.quizId");

    if (!submission) {
      return null;
    }

    // If match is completed, return aggregated data
    const match = submission.matchId as any;
    if (match && match.status === "Completed") {
      return this.aggregateSubmissionData(submission);
    }

    return submission;
  }

  /**
   * Aggregate submission data for completed matches
   * Combines quiz questions, user answers, and scores
   */
  aggregateSubmissionData(submission: ISubmission): any {
    const match = submission.matchId as any;
    const matchQuizzes = match.quizzes || [];

    // Aggregate quiz answers with question data
    // Match quizzes by index (since quizAnswers array order should match match.quizzes order)
    const aggregatedQuizAnswers = submission.quizAnswers.map((answer: any, index: number) => {
      // Try to find quiz by index first (most common case)
      const quiz =
        matchQuizzes[index] ||
        matchQuizzes.find((q: any, idx: number) => {
          // Try matching by questionId if available
          if (answer.quizId) {
            const answerQuizId = String(answer.quizId?._id || answer.quizId);
            const quizQuestionId = q.questionId ? String(q.questionId) : null;
            const quizId = q._id ? String(q._id) : null;
            return quizQuestionId === answerQuizId || quizId === answerQuizId;
          }
          return idx === index;
        });

      if (!quiz) {
        return {
          question: "Question not found",
          options: [],
          userSelectedOption: answer.selectedOption,
          correctAnswer: null,
          points: 0,
          pointsEarned: answer.pointsEarned || 0,
          isCorrect: answer.isCorrect || false,
        };
      }

      return {
        question: quiz.question || "Question",
        options: (quiz.options || []).map((opt: any) => ({
          text: opt.text || opt,
        })),
        userSelectedOption: answer.selectedOption,
        correctAnswer: quiz.correctAnswer,
        points: quiz.points || 0,
        pointsEarned: answer.pointsEarned || 0,
        isCorrect: answer.isCorrect || false,
      };
    });

    // Calculate totals
    const totalPointsAvailable = matchQuizzes.reduce(
      (sum: number, quiz: any) => sum + (quiz.points || 0),
      0
    );
    const totalPointsEarned = submission.totalPointsEarned || 0;

    return {
      _id: submission._id,
      userId: submission.userId,
      matchId: {
        _id: match._id,
        matchNumber: match.matchNumber,
        status: match.status,
        score: match.score,
        teamA: match.teamA,
        teamB: match.teamB,
        players: {
          teamA: match.players?.teamA || [],
          teamB: match.players?.teamB || [],
        },
      },
      teamASelectedPlayers: submission.teamASelectedPlayers,
      teamBSelectedPlayers: submission.teamBSelectedPlayers,
      quizAnswers: aggregatedQuizAnswers,
      totalPoints: totalPointsAvailable,
      totalPointsEarned: totalPointsEarned,
      status: submission.status,
      submittedAt: submission.submittedAt,
      evaluatedAt: submission.evaluatedAt,
      createdAt: submission.createdAt,
      updatedAt: submission.updatedAt,
      scoreSummary: {
        totalPointsAvailable,
        totalPointsEarned,
        percentage:
          totalPointsAvailable > 0
            ? Math.round((totalPointsEarned / totalPointsAvailable) * 100)
            : 0,
      },
    };
  }

  /**
   * Evaluate a submission
   * Compare answers with correct answers and calculate points
   */
  async evaluateSubmission(submissionId: string): Promise<ISubmission> {
    const submission = await Submission.findById(submissionId);
    if (!submission) {
      throw new Error("Submission not found");
    }

    // Get all quizzes for the match
    const quizzes = await Quiz.find({ matchId: submission.matchId });

    // Create a map of quiz ID to quiz for easy lookup
    const quizMap = new Map<string, IQuiz>();
    quizzes.forEach((quiz) => {
      quizMap.set(String(quiz._id), quiz);
    });

    // Evaluate each answer
    let totalPointsEarned = 0;
    submission.quizAnswers.forEach((answer) => {
      const quiz = quizMap.get(answer.quizId.toString()) as any;
      if (quiz) {
        const isCorrect = answer.selectedOption === (quiz.correctAnswer || -1);
        answer.isCorrect = isCorrect;
        answer.pointsEarned = isCorrect ? quiz.points || 0 : 0;
        totalPointsEarned += answer.pointsEarned;
      }
    });

    // Update submission
    submission.totalPointsEarned = totalPointsEarned;
    submission.status = "evaluated";
    submission.evaluatedAt = new Date();

    const savedSubmission = await submission.save();

    const populated = await Submission.findById(savedSubmission._id)
      .populate({
        path: "matchId",
        populate: [
          { path: "teamA" },
          { path: "teamB" },
          { path: "players.teamA" },
          { path: "players.teamB" },
        ],
      })
      .populate("teamASelectedPlayers")
      .populate("teamBSelectedPlayers")
      .populate("quizAnswers.quizId");

    if (!populated) {
      throw new Error("Failed to retrieve evaluated submission");
    }

    return populated;
  }

  /**
   * Evaluate all submissions for a match
   * Used when match is marked as Completed
   * Uses bulk operations and batching for scalability
   */
  async evaluateAllSubmissionsForMatch(matchId: string): Promise<void> {
    const match = await Match.findById(matchId);
    if (!match) {
      throw new Error("Match not found");
    }

    if (!match.quizzes || match.quizzes.length === 0) {
      logger.warn(
        { matchId },
        "Match has no quizzes to evaluate, marking submissions as evaluated with 0 points"
      );
    }

    const totalPointsAvailable = (match.quizzes || []).reduce(
      (sum, quiz) => sum + (quiz.points || 0),
      0
    );
    const batchSize = 1000;
    let processedCount = 0;
    let hasMore = true;

    // Create a map of quiz questionId to quiz for better matching
    const quizMap = new Map<string, any>();
    (match.quizzes || []).forEach((quiz: any, index: number) => {
      if (quiz.questionId) {
        quizMap.set(quiz.questionId, { ...quiz, index });
      }
      if (quiz._id) {
        quizMap.set(quiz._id.toString(), { ...quiz, index });
      }
    });

    logger.info(
      { matchId, totalPointsAvailable, quizCount: match.quizzes?.length || 0 },
      "Starting submission evaluation"
    );

    while (hasMore) {
      // Don't use skip - we're changing status so the query will return different results each time
      const submissions = await Submission.find({
        matchId: new mongoose.Types.ObjectId(matchId),
        status: { $ne: "evaluated" },
      })
        .limit(batchSize)
        .lean();

      if (submissions.length === 0) {
        hasMore = false;
        break;
      }

      const bulkOps = submissions.map((submission) => {
        let totalPointsEarned = 0;
        const updatedQuizAnswers = submission.quizAnswers.map((answer: any, index: number) => {
          // Try to match quiz by quizId first, then fall back to index
          let matchQuiz: any = null;

          if (answer.quizId) {
            const quizIdStr = answer.quizId.toString();
            matchQuiz = quizMap.get(quizIdStr);
          }

          // Fall back to matching by index
          if (!matchQuiz && match.quizzes && match.quizzes[index]) {
            matchQuiz = match.quizzes[index];
          }

          if (
            matchQuiz &&
            matchQuiz.correctAnswer !== null &&
            matchQuiz.correctAnswer !== undefined
          ) {
            const isCorrect = answer.selectedOption === matchQuiz.correctAnswer;
            const pointsEarned = isCorrect ? matchQuiz.points || 0 : 0;
            totalPointsEarned += pointsEarned;

            logger.debug(
              {
                submissionId: submission._id,
                quizIndex: index,
                userAnswer: answer.selectedOption,
                correctAnswer: matchQuiz.correctAnswer,
                isCorrect,
                pointsEarned,
              },
              "Evaluated quiz answer"
            );

            return {
              ...answer,
              isCorrect,
              pointsEarned,
            };
          } else {
            logger.warn(
              {
                submissionId: submission._id,
                quizIndex: index,
                quizId: answer.quizId?.toString(),
                matchQuiz: matchQuiz ? "found but no correctAnswer" : "not found",
              },
              "Could not evaluate quiz answer"
            );

            return {
              ...answer,
              isCorrect: false,
              pointsEarned: 0,
            };
          }
        });

        return {
          updateOne: {
            filter: { _id: submission._id },
            update: {
              $set: {
                quizAnswers: updatedQuizAnswers,
                totalPoints: totalPointsAvailable,
                totalPointsEarned,
                status: "evaluated",
                evaluatedAt: new Date(),
              },
            },
          },
        };
      });

      await Submission.bulkWrite(bulkOps, { ordered: false });
      processedCount += submissions.length;

      logger.info(
        { matchId, processedCount, batchSize: submissions.length },
        "Evaluated batch of submissions"
      );
    }

    logger.info({ matchId, totalProcessed: processedCount }, "All submissions evaluated");
  }

  /**
   * Helper to calculate total points from quiz answers
   */
  calculatePoints(
    _quizAnswers: Array<{ quizId: string; selectedOption: number }>,
    quizzes: IQuiz[]
  ): number {
    return quizzes.reduce((sum, quiz: any) => sum + (quiz.points || 0), 0);
  }
}

export const submissionService = new SubmissionService();
