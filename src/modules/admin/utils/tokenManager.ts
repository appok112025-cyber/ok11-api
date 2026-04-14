import jwt from "jsonwebtoken";
import env from "../../../shared/config/env.js";

export interface TokenPayload {
  adminId: string;
  email: string;
  role: string;
}

/**
 * Generate a JWT session token for an admin user
 * @param payload - Token payload containing admin information
 * @returns Signed JWT token
 */
export function generateSessionToken(payload: TokenPayload): string {
  // Use type assertion to work around strict JWT types
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  } as jwt.SignOptions);
}

/**
 * Verify and decode a JWT session token
 * @param token - JWT token to verify
 * @returns Decoded token payload
 * @throws Error if token is invalid or expired
 */
export function verifySessionToken(token: string): TokenPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error("Session token has expired");
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error("Invalid session token");
    }
    throw error;
  }
}
