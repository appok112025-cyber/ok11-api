import { Request, Response } from "express";
import { uploadService } from "./upload.service.js";
import {
  sendSuccess,
  sendCreated,
  sendBadRequest,
  sendNotFound,
} from "../../shared/utils/response.js";
import logger from "../../shared/config/logger.js";

// Extend Express Request type to include file from multer
declare global {
  namespace Express {
    namespace Multer {
      interface File {
        fieldname: string;
        originalname: string;
        encoding: string;
        mimetype: string;
        size: number;
        buffer: Buffer;
      }
    }
    interface Request {
      file?: Express.Multer.File;
    }
  }
}

// Dynamic import of multer for ES module compatibility
const multerModule = await import("multer");
const multer = multerModule.default;

// Multer configuration for in-memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (_req: any, file: any, cb: any) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed types: ${allowedTypes.join(", ")}`));
    }
  },
});

export class UploadController {
  /**
   * Get presigned URL for client-side upload
   * POST /api/upload/presigned-url
   * Body: { fileName: string, mimeType: string, fileSize: number }
   */
  async getPresignedUploadUrl(req: Request, res: Response): Promise<void> {
    try {
      const { fileName, mimeType, fileSize } = req.body;

      if (!fileName || !mimeType || !fileSize) {
        sendBadRequest(res, "fileName, mimeType, and fileSize are required");
        return;
      }

      const result = await uploadService.generatePresignedUploadUrl(
        fileName,
        mimeType,
        Number(fileSize)
      );

      sendSuccess(res, {
        uploadUrl: result.uploadUrl,
        fileId: result.fileId,
        fileUrl: result.fileUrl,
        expiresIn: result.expiresIn,
        message:
          "Upload the file to the uploadUrl using PUT method with the file as the request body",
      });
    } catch (error) {
      if (error instanceof Error) {
        sendBadRequest(res, error.message);
        return;
      }
      logger.error({ error, body: req.body }, "Error generating presigned upload URL");
      throw error;
    }
  }

  /**
   * Direct file upload (for admin panel)
   * POST /api/upload
   * Multipart form data with file field named "file"
   */
  async uploadFile(req: Request, res: Response): Promise<void> {
    try {
      const file = req.file;

      if (!file) {
        sendBadRequest(res, "No file uploaded");
        return;
      }

      const result = await uploadService.uploadFile(file.buffer, file.originalname, file.mimetype);

      sendCreated(res, result);
    } catch (error) {
      if (error instanceof Error) {
        sendBadRequest(res, error.message);
        return;
      }
      logger.error({ error }, "Error uploading file");
      throw error;
    }
  }

  /**
   * Get presigned download URL
   * GET /api/upload/:fileId/download-url
   */
  async getPresignedDownloadUrl(req: Request, res: Response): Promise<void> {
    try {
      const { fileId } = req.params;
      const expiresIn = req.query.expiresIn ? Number(req.query.expiresIn) : 3600;

      // Check if file exists
      const exists = await uploadService.fileExists(fileId);
      if (!exists) {
        sendNotFound(res, "File not found");
        return;
      }

      const url = await uploadService.generatePresignedDownloadUrl(fileId, expiresIn);

      sendSuccess(res, { downloadUrl: url, expiresIn });
    } catch (error) {
      logger.error({ error, fileId: req.params.fileId }, "Error generating presigned download URL");
      throw error;
    }
  }

  /**
   * Get file metadata
   * GET /api/upload/:fileId/metadata
   */
  async getFileMetadata(req: Request, res: Response): Promise<void> {
    try {
      const { fileId } = req.params;

      const exists = await uploadService.fileExists(fileId);
      if (!exists) {
        sendNotFound(res, "File not found");
        return;
      }

      const metadata = await uploadService.getFileMetadata(fileId);

      sendSuccess(res, { fileId, ...metadata });
    } catch (error) {
      logger.error({ error, fileId: req.params.fileId }, "Error fetching file metadata");
      throw error;
    }
  }

  /**
   * Delete file
   * DELETE /api/upload/:fileId
   * Admin only
   */
  async deleteFile(req: Request, res: Response): Promise<void> {
    try {
      const { fileId } = req.params;

      const exists = await uploadService.fileExists(fileId);
      if (!exists) {
        sendNotFound(res, "File not found");
        return;
      }

      await uploadService.deleteFile(fileId);

      sendSuccess(res, { message: "File deleted successfully" });
    } catch (error) {
      logger.error({ error, fileId: req.params.fileId }, "Error deleting file");
      throw error;
    }
  }
}

import type { RequestHandler } from "express";

export const uploadController = new UploadController();
export const uploadMiddleware: RequestHandler = upload.single("file");
