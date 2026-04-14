import { Router } from "express";
import type { Router as RouterType } from "express";
import { uploadController, uploadMiddleware } from "./upload.controller.js";
import { verifyAdminSession } from "../admin/admin.middleware.js";
import { validateBody, validateParams } from "../../shared/middleware/validation.js";
import { presignedUrlSchema, fileIdParamSchema } from "./upload.validators.js";

const router: RouterType = Router();

/**
 * @route POST /api/upload/presigned-url
 * @desc Get presigned URL for client-side upload
 * @access Public (will check auth in production)
 */
router.post(
  "/presigned-url",
  validateBody(presignedUrlSchema),
  uploadController.getPresignedUploadUrl.bind(uploadController)
);

/**
 * @route POST /api/upload
 * @desc Direct file upload (for admin panel)
 * @access Admin only
 */
router.post(
  "/",
  verifyAdminSession,
  uploadMiddleware,
  uploadController.uploadFile.bind(uploadController)
);

/**
 * @route GET /api/upload/:fileId/download-url
 * @desc Get presigned download URL
 * @access Public
 */
router.get(
  "/:fileId/download-url",
  validateParams(fileIdParamSchema),
  uploadController.getPresignedDownloadUrl.bind(uploadController)
);

/**
 * @route GET /api/upload/:fileId/metadata
 * @desc Get file metadata
 * @access Public
 */
router.get(
  "/:fileId/metadata",
  validateParams(fileIdParamSchema),
  uploadController.getFileMetadata.bind(uploadController)
);

/**
 * @route DELETE /api/upload/:fileId
 * @desc Delete file
 * @access Admin only
 */
router.delete(
  "/:fileId",
  verifyAdminSession,
  validateParams(fileIdParamSchema),
  uploadController.deleteFile.bind(uploadController)
);

export default router;
