import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

interface ValidationError {
  field: string;
  message: string;
}

// Validate request body
export function validateBody(schema: ZodSchema) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = await schema.parseAsync(req.body);
      req.body = validated;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors: ValidationError[] = error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        }));

        res.status(400).json({
          error: "Validation failed",
          code: "VALIDATION_ERROR",
          details: errors,
          timestamp: new Date().toISOString(),
        });
        return;
      }
      next(error);
    }
  };
}

// Validate request query parameters
export function validateQuery(schema: ZodSchema) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = (await schema.parseAsync(req.query)) as Record<string, unknown>;
      // Store validated values in a custom property since req.query is read-only
      // Controllers should access validated query via (req as any).validatedQuery
      (req as any).validatedQuery = validated;
      // Also try to merge back into req.query for backward compatibility
      // This may fail silently, but validatedQuery will always work
      try {
        Object.assign(req.query, validated);
      } catch {
        // Ignore - validatedQuery is the source of truth
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors: ValidationError[] = error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        }));

        res.status(400).json({
          error: "Validation failed",
          code: "VALIDATION_ERROR",
          details: errors,
          timestamp: new Date().toISOString(),
        });
        return;
      }
      next(error);
    }
  };
}

// Validate request params
export function validateParams(schema: ZodSchema) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = await schema.parseAsync(req.params);
      req.params = validated as typeof req.params;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors: ValidationError[] = error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        }));

        res.status(400).json({
          error: "Validation failed",
          code: "VALIDATION_ERROR",
          details: errors,
          timestamp: new Date().toISOString(),
        });
        return;
      }
      next(error);
    }
  };
}
