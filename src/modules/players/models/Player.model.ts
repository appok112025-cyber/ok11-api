import mongoose, { Schema, Document } from "mongoose";

export interface IPlayer extends Document {
  name: string;
  imageUrl?: string;
  role: "wk" | "bat" | "ar" | "bowl";
  createdAt: Date;
  updatedAt: Date;
}

const PlayerSchema = new Schema<IPlayer>(
  {
    name: {
      type: String,
      required: true,
      index: true,
    },
    imageUrl: {
      type: String,
    },
    role: {
      type: String,
      enum: ["wk", "bat", "ar", "bowl"],
      default: "bat",
    },
  },
  {
    timestamps: true,
  }
);

export const Player = mongoose.model<IPlayer>("Player", PlayerSchema);
