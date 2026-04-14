import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import type { Request } from "express";
import env from "../config/env.js";

// Create rate limiter with configurable options
export const rateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  message: {
    error: "Too many requests from this IP, please try again later",
    code: "RATE_LIMIT_EXCEEDED",
    timestamp: new Date().toISOString(),
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    return ipKeyGenerator(req.ip || req.socket.remoteAddress || "unknown");
  },
  skip: (req) => {
    // Skip rate limiting for health checks
    if (req.path === "/health") {
      return true;
    }

    // Skip rate limiting for admin users (check for Bearer token in Authorization header)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      return true;
    }

    return false;
  },
});

// Create a custom rate limiter with different settings
export function createRateLimiter(windowMs: number, max: number) {
  return rateLimit({
    windowMs,
    max,
    message: {
      error: "Too many requests, please try again later",
      code: "RATE_LIMIT_EXCEEDED",
      timestamp: new Date().toISOString(),
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => {
      return ipKeyGenerator(req.ip || req.socket.remoteAddress || "unknown");
    },
  });
}
