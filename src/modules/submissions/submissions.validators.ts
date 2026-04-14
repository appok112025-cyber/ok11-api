import { z } from "zod";

// Helper to validate MongoDB ObjectId format
const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId format");

// Quiz answer validation schema
const quizAnswerSchema = z.object({
  quizId: objectIdSchema,
  selectedOption: z.number().int().min(0).max(3, "Selected option must be between 0 and 3"),
});

// Create submission validation schema
export const createSubmissionSchema = z.object({
  userId: objectIdSchema,
  matchId: objectIdSchema,
  teamASelectedPlayers: z.array(objectIdSchema).min(0, "teamASelectedPlayers must be an array"),
  teamBSelectedPlayers: z.array(objectIdSchema).min(0, "teamBSelectedPlayers must be an array"),
  quizAnswers: z
    .array(quizAnswerSchema)
    .min(1, "At least one quiz answer is required")
    .max(20, "Maximum 20 quiz answers allowed"),
});

// Update submission validation schema (all fields optional)
export const updateSubmissionSchema = z.object({
  teamASelectedPlayers: z.array(objectIdSchema).optional(),
  teamBSelectedPlayers: z.array(objectIdSchema).optional(),
  quizAnswers: z
    .array(quizAnswerSchema)
    .min(1, "At least one quiz answer is required")
    .max(20, "Maximum 20 quiz answers allowed")
    .optional(),
});

// Submission ID parameter validation
export const submissionIdParamSchema = z.object({
  id: objectIdSchema,
});

// User ID parameter validation
export const userIdParamSchema = z.object({
  userId: objectIdSchema,
});

// Match ID parameter validation
export const matchIdParamSchema = z.object({
  matchId: objectIdSchema,
});

// Query filters validation schema
export const submissionFiltersSchema = z.object({
  userId: objectIdSchema.optional(),
  matchId: objectIdSchema.optional(),
  status: z.enum(["pending", "evaluated", "completed"]).optional(),
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10)),
});
