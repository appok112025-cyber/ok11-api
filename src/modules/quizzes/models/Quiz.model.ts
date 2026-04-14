import mongoose, { Schema, Document } from "mongoose";

export interface IQuiz extends Document {
  question: string;
  createdAt: Date;
  updatedAt: Date;
}

const QuizSchema = new Schema<IQuiz>(
  {
    question: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Quiz = mongoose.model<IQuiz>("Quiz", QuizSchema);
