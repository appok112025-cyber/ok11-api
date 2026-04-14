import { S3Client } from "@aws-sdk/client-s3";
import logger from "./logger.js";

// Cloudflare R2 Configuration
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || "";
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || "";
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || "";
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "positune";
const R2_PUBLIC_DOMAIN = process.env.R2_PUBLIC_DOMAIN || ""; // Optional custom domain

// Construct R2 endpoint
const R2_ENDPOINT = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;

// Validate R2 configuration
const validateR2Config = (): boolean => {
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    logger.warn("R2 configuration is incomplete. Upload functionality will be disabled.");
    return false;
  }
  logger.info("R2 configuration validated successfully");
  return true;
};

// Create S3 client for R2 (R2 is S3-compatible)
let r2Client: S3Client | null = null;

if (validateR2Config()) {
  r2Client = new S3Client({
    region: "auto", // R2 uses "auto" region
    endpoint: R2_ENDPOINT,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });
  logger.info("R2 client initialized successfully");
}

export { r2Client, R2_BUCKET_NAME, R2_PUBLIC_DOMAIN, R2_ACCOUNT_ID };
export const isR2Configured = (): boolean => r2Client !== null;
