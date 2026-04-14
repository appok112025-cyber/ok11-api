import { Request } from "express";

// Extend Express Request type to include custom properties
declare global {
  namespace Express {
    interface Request {
      user?: {
        _id: string;
        firebaseUid: string;
        email: string;
        displayName?: string;
        role: string;
        blocked: boolean;
      };
      admin?: {
        _id: string;
        email: string;
        role: string;
      };
    }
  }
}

export {};
