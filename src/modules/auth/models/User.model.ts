import mongoose, { Schema, Document } from "mongoose";

export type IUser = Document & {
  firebaseUid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  phone?: string;
  role: "user";
  blocked: boolean;
  lastLoginAt?: Date;
  appVersion?: string;
  fcmToken?: string;
  walletBalance?: number;
  createdAt: Date;
  updatedAt: Date;
};

const UserSchema = new Schema<IUser>(
  {
    firebaseUid: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
    },
    displayName: {
      type: String,
    },
    photoURL: {
      type: String,
    },
    phone: {
      type: String,
    },
    role: {
      type: String,
      enum: ["user"],
      default: "user",
    },
    blocked: {
      type: Boolean,
      default: false,
    },
    lastLoginAt: {
      type: Date,
    },
    appVersion: {
      type: String,
    },
    fcmToken: {
      type: String,
      trim: true,
    },
    walletBalance: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

UserSchema.index({ email: 1 });

export const User = mongoose.model<IUser>("User", UserSchema);
