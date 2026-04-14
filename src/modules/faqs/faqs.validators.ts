import { z } from "zod";

// Helper to validate MongoDB ObjectId format
const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId format");

// Create FAQ validation schema
export const createFAQSchema = z.object({
  order: z.number().int().positive("Order must be a positive integer"),
  question: z.string().min(1, "Question is required"),
  answer: z.string().min(1, "Answer is required"),
});

// Update FAQ validation schema (all fields optional)
export const updateFAQSchema = z.object({
  order: z.number().int().positive("Order must be a positive integer").optional(),
  question: z.string().min(1, "Question is required").optional(),
  answer: z.string().min(1, "Answer is required").optional(),
});

// Reorder FAQs validation schema
export const reorderFAQsSchema = z.object({
  orders: z
    .array(
      z.object({
        id: objectIdSchema,
        order: z.number().int().positive("Order must be a positive integer"),
      })
    )
    .min(1, "At least one FAQ order update is required"),
});

// FAQ ID parameter validation
export const faqIdParamSchema = z.object({
  id: objectIdSchema,
});
