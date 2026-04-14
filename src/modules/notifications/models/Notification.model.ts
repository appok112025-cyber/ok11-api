import mongoose, { Schema, Document } from "mongoose";

export interface INotification extends Document {
  title: string;
  body: string;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    body: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Notification = mongoose.model<INotification>("Notification", NotificationSchema);
