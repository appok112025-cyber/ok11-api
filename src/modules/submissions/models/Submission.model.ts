import mongoose, { Schema, Document } from "mongoose";

export type SubmissionStatus = "pending" | "evaluated" | "completed";

export interface IQuizAnswer {
  quizId: mongoose.Types.ObjectId;
  selectedOption: number;
  isCorrect: boolean;
  pointsEarned: number;
}

export interface ISubmission extends Document {
  userId: mongoose.Types.ObjectId;
  matchId: mongoose.Types.ObjectId;
  teamASelectedPlayers: mongoose.Types.ObjectId[];
  teamBSelectedPlayers: mongoose.Types.ObjectId[];
  quizAnswers: IQuizAnswer[];
  totalPoints: number;
  totalPointsEarned: number;
  status: SubmissionStatus;
  submittedAt: Date;
  evaluatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const QuizAnswerSchema = new Schema<IQuizAnswer>(
  {
    quizId: {
      type: Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
    },
    selectedOption: {
      type: Number,
      required: true,
    },
    isCorrect: {
      type: Boolean,
      default: false,
    },
    pointsEarned: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const SubmissionSchema = new Schema<ISubmission>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    matchId: {
      type: Schema.Types.ObjectId,
      ref: "Match",
      required: true,
    },
    teamASelectedPlayers: {
      type: [Schema.Types.ObjectId],
      ref: "Player",
      default: [],
    },
    teamBSelectedPlayers: {
      type: [Schema.Types.ObjectId],
      ref: "Player",
      default: [],
    },
    quizAnswers: {
      type: [QuizAnswerSchema],
      default: [],
    },
    totalPoints: {
      type: Number,
      required: true,
    },
    totalPointsEarned: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["pending", "evaluated", "completed"],
      default: "pending",
      index: true,
    },
    submittedAt: {
      type: Date,
      required: true,
    },
    evaluatedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Create unique compound index to enforce one submission per user per match
SubmissionSchema.index({ userId: 1, matchId: 1 }, { unique: true });

export const Submission = mongoose.model<ISubmission>("Submission", SubmissionSchema);
