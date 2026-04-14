import { z } from "zod";

// Helper to validate MongoDB ObjectId format
const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId format");

// Create player validation schema
export const createPlayerSchema = z.object({
  name: z.string().min(1, "Player name is required").trim(),
});

// Update player validation schema
export const updatePlayerSchema = z.object({
  name: z.string().min(1, "Player name is required").trim().optional(),
});

// Player ID parameter validation
export const playerIdParamSchema = z.object({
  id: objectIdSchema,
});

// Team ID parameter validation for filtering players by team
export const teamIdParamSchema = z.object({
  teamId: objectIdSchema,
});
