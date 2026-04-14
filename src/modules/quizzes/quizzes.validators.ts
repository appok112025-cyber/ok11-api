import { z } from "zod";

// Helper to validate MongoDB ObjectId format
const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId format");

// Create quiz validation schema
export const createQuizSchema = z.object({
  question: z.string().min(1, "Question is required"),
});

// Update quiz validation schema
export const updateQuizSchema = z.object({
  question: z.string().min(1, "Question is required").optional(),
});

// Match ID parameter validation
export const matchIdParamSchema = z.object({
  matchId: objectIdSchema,
});

// Quiz ID parameter validation
export const quizIdParamSchema = z.object({
  id: objectIdSchema,
});
