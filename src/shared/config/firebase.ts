import admin from "firebase-admin";
import { readFileSync } from "fs";
import { resolve } from "path";
import env from "./env.js";
import logger from "./logger.js";

let firebaseInitialized = false;
const FIREBASE_SERVICE_ACCOUNT_PATH = "./secrets/firebase-admin.json";
try {
  const serviceAccountPath = resolve(process.cwd(), FIREBASE_SERVICE_ACCOUNT_PATH);
  const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf8"));

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: env.FIREBASE_PROJECT_ID,
    storageBucket: `${env.FIREBASE_PROJECT_ID}.appspot.com`,
  });

  firebaseInitialized = true;
  logger.info("✅ Firebase Admin SDK initialized successfully");
} catch (error) {
  logger.error({ err: error }, "❌ Failed to initialize Firebase Admin SDK");
  throw new Error("Firebase initialization failed");
}

// Export auth instance for token verification
export const auth: admin.auth.Auth = admin.auth();
export { firebaseInitialized };
export default admin;
