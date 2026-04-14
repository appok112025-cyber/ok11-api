import { z } from "zod";

// Helper to validate MongoDB ObjectId format
const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId format");

// Match status enum
const matchStatusSchema = z.enum(["Upcoming", "Live", "Completed", "Cancelled"]);

// Quiz validation schemas
const quizOptionSchema = z.object({
  text: z.string().min(1, "Option text is required"),
});

const matchQuizSchema = z.object({
  questionId: z.string().optional(),
  question: z.string().min(1, "Question is required"),
  options: z
    .array(quizOptionSchema)
    .min(2, "At least 2 options required")
    .max(4, "Maximum 4 options allowed"),
  correctAnswer: z.number().int().min(0).nullable(),
  points: z.number().int().positive("Points must be positive").default(10),
});

// Create match validation schema
export const createMatchSchema = z.object({
  matchNumber: z.number().int().positive("Match number must be a positive integer"),
  matchName: z.string().optional(),
  teamA: objectIdSchema.refine((val) => val, { message: "Team A ID is required" }),
  teamB: objectIdSchema.refine((val) => val, { message: "Team B ID is required" }),
  matchTime: z.string().datetime().or(z.date()),
  status: matchStatusSchema.optional(),
  score: z.string().optional(),
  players: z.object({
    teamA: z.array(objectIdSchema).min(1, "At least one player required for Team A"),
    teamB: z.array(objectIdSchema).min(1, "At least one player required for Team B"),
  }),
  quizzes: z.array(matchQuizSchema).optional().default([]),
});

// Update match validation schema (all fields optional)
export const updateMatchSchema = z.object({
  matchNumber: z.number().int().positive("Match number must be a positive integer").optional(),
  matchName: z.string().optional(),
  teamA: objectIdSchema.optional(),
  teamB: objectIdSchema.optional(),
  matchTime: z.string().datetime().or(z.date()).optional(),
  status: matchStatusSchema.optional(),
  score: z.string().optional(),
  players: z
    .object({
      teamA: z.array(objectIdSchema).min(1, "At least one player required for Team A").optional(),
      teamB: z.array(objectIdSchema).min(1, "At least one player required for Team B").optional(),
    })
    .optional(),
  quizzes: z.array(matchQuizSchema).optional(),
});

// Query filters validation schema
export const matchFiltersSchema = z.object({
  status: matchStatusSchema.optional(),
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10)),
});

// Match ID parameter validation
export const matchIdParamSchema = z.object({
  id: objectIdSchema,
});
