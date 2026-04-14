// Export routes
export { default as uploadRoutes } from "./upload.routes.js";

// Export services
export { uploadService, UploadService } from "./upload.service.js";
export type { UploadResult, PresignedUrlResult } from "./upload.service.js";

// Export validators
export {
  presignedUrlSchema,
  fileIdParamSchema,
  downloadUrlQuerySchema,
} from "./upload.validators.js";
export type { PresignedUrlDTO, FileIdParam, DownloadUrlQuery } from "./upload.validators.js";

// Export controller
export { uploadController, UploadController, uploadMiddleware } from "./upload.controller.js";
