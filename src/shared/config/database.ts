import mongoose from "mongoose";
import env from "./env.js";

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 5000;

let isConnected = false;

async function connectWithRetry(attempt = 1): Promise<void> {
  try {
    console.log(`🔌 Attempting to connect to MongoDB (attempt ${attempt}/${MAX_RETRIES})...`);

    await mongoose.connect(env.MONGODB_URI);

    isConnected = true;
    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error(`❌ MongoDB connection failed (attempt ${attempt}/${MAX_RETRIES}):`, error);

    if (attempt < MAX_RETRIES) {
      console.log(`⏳ Retrying in ${RETRY_DELAY_MS / 1000} seconds...`);
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      return connectWithRetry(attempt + 1);
    } else {
      console.error("❌ Failed to connect to MongoDB after all retries");
      process.exit(1);
    }
  }
}

// Connection event handlers
mongoose.connection.on("connected", () => {
  isConnected = true;
  console.log("📡 MongoDB connection established");
});

mongoose.connection.on("disconnected", () => {
  isConnected = false;
  console.warn("⚠️  MongoDB disconnected");
});

mongoose.connection.on("error", (error) => {
  isConnected = false;
  console.error("❌ MongoDB connection error:", error);
});

mongoose.connection.on("reconnected", () => {
  isConnected = true;
  console.log("🔄 MongoDB reconnected");
});

// Graceful shutdown
process.on("SIGINT", async () => {
  try {
    await mongoose.connection.close();
    console.log("👋 MongoDB connection closed through app termination");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error closing MongoDB connection:", error);
    process.exit(1);
  }
});

process.on("SIGTERM", async () => {
  try {
    await mongoose.connection.close();
    console.log("👋 MongoDB connection closed through app termination");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error closing MongoDB connection:", error);
    process.exit(1);
  }
});

export { connectWithRetry, isConnected };
export default mongoose.connection;
