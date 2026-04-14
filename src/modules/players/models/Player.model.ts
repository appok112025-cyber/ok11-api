import mongoose, { Schema, Document } from "mongoose";

export interface IPlayer extends Document {
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

const PlayerSchema = new Schema<IPlayer>(
  {
    name: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Player = mongoose.model<IPlayer>("Player", PlayerSchema);
