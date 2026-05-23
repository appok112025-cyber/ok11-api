import fs from "fs";
import path from "path";
import express, { Express, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import mongoose from "mongoose";
import env from "./shared/config/env.js";
import { httpLogger } from "./shared/config/logger.js";
import { errorHandler } from "./shared/middleware/errorHandler.js";
import { rateLimiter } from "./shared/middleware/rateLimiter.js";

const app: Express = express();

// Security middleware
app.use(helmet());

// CORS configuration
const corsOrigins = env.CORS_ORIGIN.split(",").map((origin) => origin.trim());
app.use(
  cors({
    origin: corsOrigins,
    credentials: env.CORS_CREDENTIALS,
  })
);

// Rate limiting middleware (100 requests per 15 minutes per IP)
app.use(rateLimiter);

// Body parser middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// HTTP logger middleware (must be after body parsers, before compression)
app.use(httpLogger);

// Compression middleware
app.use(compression());

// Debug Request Logger
app.use((req, res, next) => {
  const log = `[${new Date().toISOString()}] ${req.method} ${req.url}\n`;
  try {
    fs.appendFileSync(path.resolve(process.cwd(), 'api-requests.txt'), log);
  } catch (e) {}
  next();
});

// Root endpoint
app.get("/", (_req: Request, res: Response) => {
  res.json({
    message: "OK11 API Server",
    version: "1.0.0",
    status: "running",
    timestamp: new Date().toISOString(),
  });
});

// Health check endpoint
app.get("/health", (_req: Request, res: Response) => {
  const dbStatus = mongoose.connection.readyState;
  const isDbConnected = dbStatus === 1; // 1 = connected

  if (!isDbConnected) {
    res.status(503).json({
      status: "unhealthy",
      database: "disconnected",
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
    });
    return;
  }

  res.status(200).json({
    status: "healthy",
    database: "connected",
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

// Mount module routes
import { authRoutes } from "./modules/auth/index.js";
import { adminRoutes } from "./modules/admin/index.js";
import { matchRoutes } from "./modules/matches/index.js";
import { faqRoutes } from "./modules/faqs/index.js";
import teamRoutes from "./modules/teams/index.js";
import quizRoutes from "./modules/quizzes/index.js";
import playerRoutes from "./modules/players/index.js";
import { submissionRoutes } from "./modules/submissions/index.js";
import { siteContentRoutes } from "./modules/site-content/index.js";
import userRoutes from "./modules/users/index.js";
import { dashboardRoutes } from "./modules/dashboard/index.js";
import notificationRoutes from "./modules/notifications/index.js";
import { uploadRoutes } from "./modules/upload/index.js";
import { contestRoutes } from "./modules/contests/index.js";

app.use("/api/auth", authRoutes);
app.use("/api/auth/admin", adminRoutes);
app.use("/api/matches", matchRoutes);
app.use("/api/faqs", faqRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/players", playerRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/site-content", siteContentRoutes);
app.use("/api/users", userRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/contests", contestRoutes);

// 404 handler for unknown routes
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: "Route not found",
    code: "NOT_FOUND",
    timestamp: new Date().toISOString(),
  });
});

// Global error handler (must be last)
app.use(errorHandler);

export default app;
