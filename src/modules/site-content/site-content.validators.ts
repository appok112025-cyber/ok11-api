import { z } from "zod";

const pointItemSchema = z
  .object({
    title: z.string().trim().optional().default(""),
    description: z.string().trim().optional().default(""),
  })
  .passthrough();

const termItemSchema = z
  .object({
    title: z.string().trim().optional().default(""),
    description: z.string().trim().optional().default(""),
  })
  .passthrough();

const socialLinkSchemaOptional = z
  .object({
    title: z.string().trim().optional().default(""),
    url: z.string().trim().optional().default(""),
  })
  .passthrough();

export const updateAboutSchema = z
  .object({
    content: z.string().default(""),
    links: z.array(socialLinkSchemaOptional).default([]),
  })
  .transform((data) => ({
    ...data,
    links: data.links.filter((link) => link.title?.trim() && link.url?.trim()),
  }));

export const updatePointsSchema = z
  .object({
    content: z.string().default(""),
    items: z.array(pointItemSchema).default([]),
  })
  .transform((data) => {
    // Filter out incomplete items (missing title or description)
    // But allow empty array to pass through (all points deleted)
    const validItems = data.items.filter((item) => item.title?.trim() && item.description?.trim());
    return {
      ...data,
      items: validItems, // Can be empty array
    };
  });

export const updateTermsSchema = z
  .object({
    content: z.string().default(""),
    items: z.array(termItemSchema).default([]),
  })
  .transform((data) => ({
    ...data,
    items: data.items.filter((item) => item.title?.trim() && item.description?.trim()),
  }));

export type UpdateAboutDTO = z.infer<typeof updateAboutSchema>;
export type UpdatePointsDTO = z.infer<typeof updatePointsSchema>;
export type UpdateTermsDTO = z.infer<typeof updateTermsSchema>;
