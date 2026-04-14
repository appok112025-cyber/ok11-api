import { z } from "zod";

// Helper to validate MongoDB ObjectId format
const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId format");

// Create notification validation schema
export const createNotificationSchema = z.object({
  title: z.string().min(1, "Title is required").trim(),
  body: z.string().min(1, "Body is required").trim(),
  image: z.union([z.string().url("Invalid image URL").trim(), z.literal("")]).optional(),
});

// Update notification validation schema
export const updateNotificationSchema = z.object({
  title: z.string().min(1, "Title is required").trim().optional(),
  body: z.string().min(1, "Body is required").trim().optional(),
  image: z.union([z.string().url("Invalid image URL").trim(), z.literal("")]).optional(),
});

// Notification ID parameter validation
export const notificationIdParamSchema = z.object({
  id: objectIdSchema,
});
