import { z } from "zod";

// Presigned URL request schema
export const presignedUrlSchema = z.object({
  fileName: z.string().min(1).max(255),
  mimeType: z.enum(["image/jpeg", "image/png", "image/gif", "image/webp"]),
  fileSize: z
    .number()
    .min(1)
    .max(10 * 1024 * 1024), // Max 10MB
});

// File ID parameter schema
export const fileIdParamSchema = z.object({
  fileId: z
    .string()
    .uuid()
    .or(z.string().regex(/^\d+-[a-f0-9-]+\.[a-z]+$/i)),
});

// Download URL query schema
export const downloadUrlQuerySchema = z.object({
  expiresIn: z
    .string()
    .optional()
    .transform((val) => (val ? Number(val) : 3600))
    .refine((val) => val >= 60 && val <= 86400, {
      message: "expiresIn must be between 60 and 86400 seconds (1 minute to 24 hours)",
    }),
});

export type PresignedUrlDTO = z.infer<typeof presignedUrlSchema>;
export type FileIdParam = z.infer<typeof fileIdParamSchema>;
export type DownloadUrlQuery = z.infer<typeof downloadUrlQuerySchema>;
