import admin from "firebase-admin";
import { readFileSync } from "fs";
import { resolve } from "path";
import env from "./env.js";
import logger from "./logger.js";

let firebaseInitialized = false;
const FIREBASE_SERVICE_ACCOUNT_PATH = "./secrets/firebase-admin.json";
try {
  let serviceAccount: any;

  logger.info({
    hasServiceAccountEnv: !!env.FIREBASE_SERVICE_ACCOUNT,
    serviceAccountEnvLength: env.FIREBASE_SERVICE_ACCOUNT?.length || 0,
    hasPrivateKeyEnv: !!env.FIREBASE_PRIVATE_KEY,
    hasClientEmailEnv: !!env.FIREBASE_CLIENT_EMAIL,
    detectedFirebaseEnvKeys: Object.keys(process.env).filter(k => k.toUpperCase().includes("FIREBASE")),
  }, "Firebase SDK Initialization Info");

  if (env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      serviceAccount = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT);
    } catch (err: any) {
      logger.error({ err: err.message }, "❌ Failed to parse FIREBASE_SERVICE_ACCOUNT JSON env variable");
      throw new Error("Invalid FIREBASE_SERVICE_ACCOUNT JSON");
    }
  } else if (env.FIREBASE_PRIVATE_KEY && env.FIREBASE_CLIENT_EMAIL) {
    serviceAccount = {
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    };
  } else {
    const serviceAccountPath = resolve(process.cwd(), FIREBASE_SERVICE_ACCOUNT_PATH);
    serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf8"));
  }

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
