import { Response } from "express";

interface SuccessResponse<T = unknown> {
  success: true;
  data: T;
  timestamp: string;
}

interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: unknown;
  timestamp: string;
}

// Send success response
export function sendSuccess<T>(res: Response, data: T, statusCode: number = 200): void {
  const response: SuccessResponse<T> = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };

  res.status(statusCode).json(response);
}

// Send error response
export function sendError(
  res: Response,
  error: string,
  statusCode: number = 500,
  code?: string,
  details?: unknown
): void {
  const response: ErrorResponse = {
    success: false,
    error,
    code,
    details,
    timestamp: new Date().toISOString(),
  };

  res.status(statusCode).json(response);
}

// Send created response (201)
export function sendCreated<T>(res: Response, data: T): void {
  sendSuccess(res, data, 201);
}

// Send no content response (204)
export function sendNoContent(res: Response): void {
  res.status(204).send();
}

// Send not found response (404)
export function sendNotFound(res: Response, message: string = "Resource not found"): void {
  sendError(res, message, 404, "NOT_FOUND");
}

// Send unauthorized response (401)
export function sendUnauthorized(res: Response, message: string = "Unauthorized"): void {
  sendError(res, message, 401, "UNAUTHORIZED");
}

// Send forbidden response (403)
export function sendForbidden(res: Response, message: string = "Forbidden"): void {
  sendError(res, message, 403, "FORBIDDEN");
}

// Send bad request response (400)
export function sendBadRequest(res: Response, message: string, details?: unknown): void {
  sendError(res, message, 400, "BAD_REQUEST", details);
}
