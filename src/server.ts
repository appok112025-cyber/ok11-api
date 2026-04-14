import app from "./app.js";
import env from "./shared/config/env.js";
import logger from "./shared/config/logger.js";
import { connectWithRetry } from "./shared/config/database.js";
import { initDatabase } from "./shared/config/initDatabase.js";
import { matchCronService } from "./shared/services/matchCron.service.js";

async function startServer() {
  try {
    // Connect to MongoDB with retry logic
    logger.info("🔌 Connecting to MongoDB...");
    await connectWithRetry();

    // Run database initialization/seeding
    logger.info("🔧 Running database initialization...");
    await initDatabase();

    // Start cron jobs for match notifications and status updates
    logger.info("⏰ Starting match cron jobs...");
    matchCronService.start();

    // Start Express server
    const PORT = env.PORT;
    app.listen(PORT, () => {
      logger.info(`🚀 Started server process [${process.pid}]`);
      logger.info(`⏳ Waiting for application startup.`);
      logger.info(`✅ Application startup complete.`);
      logger.info(`🌐 Server running on http://0.0.0.0:${PORT} (Press CTRL+C to quit)`);
    });
  } catch (error) {
    logger.error({ err: error }, "Failed to start server");
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  logger.error({ err: error }, "Uncaught Exception");
  process.exit(1);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  logger.error({ reason, promise }, "Unhandled Rejection");
  process.exit(1);
});

// Start the server
startServer();
