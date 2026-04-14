import { Request, Response, NextFunction } from "express";
import { Error as MongooseError } from "mongoose";
import { ZodError } from "zod";
import env from "../config/env.js";
import logger from "../config/logger.js";

interface ErrorResponse {
  error: string;
  code?: string;
  details?: unknown;
  timestamp: string;
}

// Custom error class for API errors
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  const timestamp = new Date().toISOString();

  // Log error with appropriate severity
  if (err instanceof ApiError && err.statusCode < 500) {
    logger.warn({ err, statusCode: err.statusCode }, err.message);
  } else {
    logger.error({ err }, "Unhandled error");
  }

  // Handle Mongoose validation errors
  if (err instanceof MongooseError.ValidationError) {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));

    const response: ErrorResponse = {
      error: "Validation failed",
      code: "VALIDATION_ERROR",
      details: env.NODE_ENV === "development" ? errors : undefined,
      timestamp,
    };

    res.status(400).json(response);
    return;
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const errors = err.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));

    const response: ErrorResponse = {
      error: "Validation failed",
      code: "VALIDATION_ERROR",
      details: env.NODE_ENV === "development" ? errors : undefined,
      timestamp,
    };

    res.status(400).json(response);
    return;
  }

  // Handle Firebase auth errors
  if (err.name === "FirebaseAuthError" || err.message.includes("auth/")) {
    const response: ErrorResponse = {
      error: "Authentication failed",
      code: "AUTH_FAILED",
      details: env.NODE_ENV === "development" ? err.message : undefined,
      timestamp,
    };

    res.status(401).json(response);
    return;
  }

  // Handle custom API errors
  if (err instanceof ApiError) {
    const response: ErrorResponse = {
      error: err.message,
      code: err.code,
      details: env.NODE_ENV === "development" ? err.details : undefined,
      timestamp,
    };

    res.status(err.statusCode).json(response);
    return;
  }

  // Handle all other errors
  const response: ErrorResponse = {
    error:
      env.NODE_ENV === "production"
        ? "Internal Server Error"
        : err.message || "An unexpected error occurred",
    code: "INTERNAL_ERROR",
    details: env.NODE_ENV === "development" ? err.stack : undefined,
    timestamp,
  };

  res.status(500).json(response);
}
