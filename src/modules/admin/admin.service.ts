import { SiteContent, ISiteContent } from "../site-content/models/SiteContent.model.js";
import { hashPassword, comparePassword } from "./utils/passwordHash.js";
import {
  generateSessionToken as generateToken,
  verifySessionToken as verifyToken,
  TokenPayload,
} from "./utils/tokenManager.js";
import logger from "../../shared/config/logger.js";

/**
 * Initialize default admin user if none exists
 * Creates an admin with email 'admin@ok11.in' and password 'admin123'
 * Should be called on application startup
 */
export async function initializeDefaultAdmin(): Promise<void> {
  try {
    const adminCount = await SiteContent.countDocuments({ type: "admin_creds" });

    if (adminCount === 0) {
      const defaultEmail = "admin@ok11.in";
      const defaultPassword = "admin123";

      const hashedPassword = await hashPassword(defaultPassword);

      await SiteContent.create({
        type: "admin_creds",
        email: defaultEmail,
        password: hashedPassword,
        role: "admin",
      });

      logger.info(`✅ Default admin user created (email: ${defaultEmail})`);
    } else {
      logger.info("✅ Admin user already exists, skipping initialization");
    }
  } catch (error: unknown) {
    logger.error({ error }, "❌ Failed to initialize default admin");
    throw error;
  }
}

/**
 * Verify admin credentials
 * @param email - Admin email
 * @param password - Plain text password
 * @returns Admin document if credentials are valid
 * @throws Error if credentials are invalid
 */
export async function verifyCredentials(email: string, password: string): Promise<ISiteContent> {
  // Always lowercase email for consistent lookups
  const normalizedEmail = email.toLowerCase().trim();

  if (!email || !password) {
    logger.warn({ email: normalizedEmail }, "Missing email or password");
    throw new Error("Invalid credentials");
  }

  logger.info(
    { email: normalizedEmail, passwordLength: password.length },
    "Verifying admin credentials"
  );

  // Use lean() to get plain object with password field (bypasses toJSON transform)
  const adminDoc = await SiteContent.findOne({
    type: "admin_creds",
    email: normalizedEmail,
  }).lean();

  if (!adminDoc) {
    logger.warn({ email: normalizedEmail }, "Admin not found in database");
    throw new Error("Invalid credentials");
  }

  const adminPassword = (adminDoc as any).password;

  if (!adminPassword || typeof adminPassword !== "string") {
    logger.warn(
      { email: normalizedEmail, adminId: adminDoc._id, hasPassword: !!adminPassword },
      "Admin has no valid password"
    );
    throw new Error("Invalid credentials");
  }

  logger.info(
    { email: normalizedEmail, hasPassword: true, passwordHashLength: adminPassword.length },
    "Comparing passwords"
  );

  try {
    const isPasswordValid = await comparePassword(password, adminPassword);

    logger.info({ email: normalizedEmail, isValid: isPasswordValid }, "Password comparison result");

    if (!isPasswordValid) {
      logger.warn({ email: normalizedEmail }, "Password mismatch - incorrect password");
      throw new Error("Invalid credentials");
    }
  } catch (compareError: any) {
    logger.error(
      { email: normalizedEmail, error: compareError.message },
      "Password comparison failed"
    );
    throw new Error("Invalid credentials");
  }

  // Return the full Mongoose document (password will be filtered in toJSON for API responses)
  const admin = await SiteContent.findOne({
    type: "admin_creds",
    email: normalizedEmail,
  });

  if (!admin) {
    logger.error({ email: normalizedEmail }, "Admin not found after password verification");
    throw new Error("Invalid credentials");
  }

  logger.info(
    { email: normalizedEmail, adminId: admin._id },
    "Admin credentials verified successfully"
  );

  return admin;
}

/**
 * Generate a session token for an admin user
 * @param admin - Admin document
 * @returns JWT session token
 */
export function generateSessionToken(admin: ISiteContent): string {
  if (!admin.email || !admin.role) {
    throw new Error("Invalid admin data");
  }

  const payload: TokenPayload = {
    adminId: String(admin._id),
    email: admin.email,
    role: admin.role,
  };

  return generateToken(payload);
}

/**
 * Verify a session token and return the admin user
 * @param token - JWT session token
 * @returns Admin document if token is valid
 * @throws Error if token is invalid or admin not found
 */
export async function verifySessionToken(token: string): Promise<ISiteContent> {
  const payload = verifyToken(token);

  const admin = await SiteContent.findOne({
    _id: payload.adminId,
    type: "admin_creds",
  });

  if (!admin) {
    throw new Error("Admin user not found");
  }

  return admin;
}

/**
 * Change admin password
 * @param adminId - Admin document ID
 * @param currentPassword - Current plain text password
 * @param newPassword - New plain text password
 */
export async function changePassword(
  adminId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const adminDoc = await SiteContent.findOne({
    _id: adminId,
    type: "admin_creds",
  }).lean();

  if (!adminDoc) {
    logger.warn({ adminId }, "Admin not found while changing password");
    throw new Error("Admin user not found");
  }

  const adminPassword = (adminDoc as any).password;

  if (!adminPassword || typeof adminPassword !== "string") {
    logger.warn(
      { adminId, hasPassword: !!adminPassword },
      "Admin has no valid password when attempting password change"
    );
    throw new Error("Invalid current password");
  }

  try {
    const isPasswordValid = await comparePassword(currentPassword, adminPassword);

    logger.info(
      { adminId, isValid: isPasswordValid },
      "Admin current password verification result"
    );

    if (!isPasswordValid) {
      logger.warn({ adminId }, "Incorrect current password provided for password change");
      throw new Error("Invalid current password");
    }
  } catch (compareError: any) {
    logger.error(
      { adminId, error: compareError.message },
      "Admin password comparison failed during password change"
    );
    throw new Error("Invalid current password");
  }

  const hashedNewPassword = await hashPassword(newPassword);

  await SiteContent.updateOne(
    { _id: adminId, type: "admin_creds" },
    { $set: { password: hashedNewPassword } }
  );

  logger.info({ adminId }, "Admin password changed successfully");
}
