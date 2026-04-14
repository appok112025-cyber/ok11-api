import { z } from "zod";

// Helper to validate MongoDB ObjectId format
const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId format");

// Create team validation schema
export const createTeamSchema = z.object({
  name: z.string().min(1, "Team name is required").trim(),
  imageUrl: z.string().url("Image URL must be a valid URL").trim(),
});

// Update team validation schema
export const updateTeamSchema = z.object({
  name: z.string().min(1, "Team name is required").trim().optional(),
  imageUrl: z.string().url("Image URL must be a valid URL").trim().optional(),
});

// Team ID parameter validation
export const teamIdParamSchema = z.object({
  id: objectIdSchema,
});
