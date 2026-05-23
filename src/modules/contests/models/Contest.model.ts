import mongoose, { Schema, Document } from "mongoose";

export type ContestStatus = "Upcoming" | "Live" | "Completed" | "Cancelled";

export interface IPrizeRange {
  fromRank: number;
  toRank: number;
  prizeAmount: number;
}

export interface IContest extends Document {
  matchId: mongoose.Types.ObjectId;
  name: string;
  firstPrize: number;
  entryFee: number;
  originalEntryFee?: number;
  totalParticipants: number;
  participantLimit: number;
  status: ContestStatus;
  isLocked: boolean;
  prizeBreakdown?: IPrizeRange[];
  createdAt: Date;
  updatedAt: Date;
}

const ContestSchema = new Schema<IContest>(
  {
    matchId: {
      type: Schema.Types.ObjectId,
      ref: "Match",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    firstPrize: {
      type: Number,
      default: 0,
    },
    entryFee: {
      type: Number,
      default: 0,
    },
    originalEntryFee: {
      type: Number,
      default: 0,
    },
    totalParticipants: {
      type: Number,
      default: 0,
    },
    participantLimit: {
      type: Number,
      default: 100,
    },
    status: {
      type: String,
      enum: ["Upcoming", "Live", "Completed", "Cancelled"],
      default: "Upcoming",
      index: true,
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
    prizeBreakdown: {
      type: [
        {
          fromRank: { type: Number, required: true },
          toRank: { type: Number, required: true },
          prizeAmount: { type: Number, required: true },
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Index for matchId and createdAt for DESC sorting
ContestSchema.index({ matchId: 1, createdAt: -1 });

export const Contest = mongoose.model<IContest>("Contest", ContestSchema);
