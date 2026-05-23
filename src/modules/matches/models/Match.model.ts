import mongoose, { Schema, Document } from "mongoose";

export type MatchStatus = "Upcoming" | "Live" | "Completed" | "Cancelled";

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

export interface IMatch extends Document {
  matchNumber: number;
  matchName?: string;
  teamA: mongoose.Types.ObjectId;
  teamB: mongoose.Types.ObjectId;
  matchTime: Date;
  status: MatchStatus;
  score?: string;
  players: {
    teamA: mongoose.Types.ObjectId[];
    teamB: mongoose.Types.ObjectId[];
  };
  participantsCount: number;
  playerPoints: Record<string, number>;
  quizzes: IMatchQuiz[];
  createdAt: Date;
  updatedAt: Date;
}

const MatchSchema = new Schema<IMatch>(
  {
    matchNumber: {
      type: Number,
      required: true,
      unique: true,
    },
    matchName: {
      type: String,
      required: false,
    },
    teamA: {
      type: Schema.Types.ObjectId,
      ref: "Team",
      required: true,
    },
    teamB: {
      type: Schema.Types.ObjectId,
      ref: "Team",
      required: true,
    },
    matchTime: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["Upcoming", "Live", "Completed", "Cancelled"],
      default: "Upcoming",
      index: true,
    },
    score: {
      type: String,
    },
    players: {
      teamA: [
        {
          type: Schema.Types.ObjectId,
          ref: "Player",
        },
      ],
      teamB: [
        {
          type: Schema.Types.ObjectId,
          ref: "Player",
        },
      ],
    },
    participantsCount: {
      type: Number,
      default: 0,
    },
    playerPoints: {
      type: Map,
      of: Number,
      default: {},
    },
    quizzes: {
      type: [
        {
          questionId: String,
          question: { type: String, required: true },
          options: [
            {
              text: { type: String, required: true },
            },
          ],
          correctAnswer: Number,
          points: { type: Number, default: 10 },
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Create index on createdAt for DESC sorting
MatchSchema.index({ createdAt: -1 });

export const Match = mongoose.model<IMatch>("Match", MatchSchema);
