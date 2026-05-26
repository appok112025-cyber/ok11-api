import mongoose, { Schema, Document } from "mongoose";

export interface IContestEntry extends Document {
  contestId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  matchId: mongoose.Types.ObjectId;
  players: mongoose.Types.ObjectId[];
  captainId: mongoose.Types.ObjectId;
  viceCaptainId: mongoose.Types.ObjectId;
  points: number;
  rank: number;
  paid: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ContestEntrySchema = new Schema<IContestEntry>(
  {
    contestId: {
      type: Schema.Types.ObjectId,
      ref: "Contest",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    matchId: {
      type: Schema.Types.ObjectId,
      ref: "Match",
      required: true,
      index: true,
    },
    players: [
      {
        type: Schema.Types.ObjectId,
        ref: "Player",
      },
    ],
    captainId: {
      type: Schema.Types.ObjectId,
      ref: "Player",
      required: true,
    },
    viceCaptainId: {
      type: Schema.Types.ObjectId,
      ref: "Player",
      required: true,
    },
    points: {
      type: Number,
      default: 0,
    },
    rank: {
      type: Number,
      default: 0,
    },
    paid: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Unique index to ensure a user joins a contest only once
ContestEntrySchema.index({ contestId: 1, userId: 1 }, { unique: true });

// Index for leaderboard sorting
ContestEntrySchema.index({ contestId: 1, points: -1 });

export const ContestEntry = mongoose.model<IContestEntry>(
  "ContestEntry",
  ContestEntrySchema
);
