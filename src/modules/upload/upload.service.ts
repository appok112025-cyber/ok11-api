import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  r2Client,
  R2_BUCKET_NAME,
  R2_PUBLIC_DOMAIN,
  isR2Configured,
} from "../../shared/config/r2.config.js";
import logger from "../../shared/config/logger.js";
import { randomUUID } from "crypto";
import { extname } from "path";

export interface UploadResult {
  fileId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: Date;
}

export interface PresignedUrlResult {
  uploadUrl: string;
  fileId: string;
  fileKey: string;
  fileUrl: string;
  expiresIn: number;
}

export class UploadService {
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private readonly ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  private readonly PRESIGNED_URL_EXPIRY = 3600; // 1 hour

  /**
   * Generate a unique file ID with proper extension
   */
  private generateFileId(originalName: string): string {
    const ext = extname(originalName);
    const uniqueId = randomUUID();
    const timestamp = Date.now();
    return `${timestamp}-${uniqueId}${ext}`;
  }

  /**
   * Get public URL for a file (returns presigned URL if bucket is not public)
   */
  private async getPublicUrl(fileId: string): Promise<string> {
    if (R2_PUBLIC_DOMAIN) {
      return `${R2_PUBLIC_DOMAIN}/${fileId}`;
    }
    // Generate presigned URL for viewing (7 days expiry)
    // This is needed because R2 buckets are private by default
    return await this.generatePresignedDownloadUrl(fileId, 7 * 24 * 3600);
  }

  /**
   * Generate presigned URL for direct upload from client
   * This is useful for uploading large files directly from the client
   */
  async generatePresignedUploadUrl(
    fileName: string,
    mimeType: string,
    fileSize: number,
    pathPrefix?: string
  ): Promise<PresignedUrlResult> {
    if (!isR2Configured()) {
      throw new Error("R2 is not configured");
    }

    // Validate file type
    if (!this.ALLOWED_IMAGE_TYPES.includes(mimeType)) {
      throw new Error(
        `File type ${mimeType} is not allowed. Allowed types: ${this.ALLOWED_IMAGE_TYPES.join(", ")}`
      );
    }

    // Validate file size
    if (fileSize > this.MAX_FILE_SIZE) {
      throw new Error(
        `File size ${fileSize} exceeds maximum allowed size of ${this.MAX_FILE_SIZE} bytes`
      );
    }

    const fileId = this.generateFileId(fileName);
    const key = pathPrefix ? `${pathPrefix}/${fileId}` : fileId;

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      ContentType: mimeType,
    });

    const uploadUrl = await getSignedUrl(r2Client!, command, {
      expiresIn: this.PRESIGNED_URL_EXPIRY,
    });

    logger.info({ fileId, fileName, mimeType }, "Generated presigned upload URL");

    // Generate presigned URL for viewing (7 days expiry)
    const fileUrl = await this.getPublicUrl(key);

    return {
      uploadUrl,
      fileId,
      fileKey: key,
      fileUrl,
      expiresIn: this.PRESIGNED_URL_EXPIRY,
    };
  }

  /**
   * Upload file directly from server (for admin uploads)
   */
  async uploadFile(fileBuffer: Buffer, fileName: string, mimeType: string): Promise<UploadResult> {
    if (!isR2Configured()) {
      throw new Error("R2 is not configured");
    }

    // Validate file type
    if (!this.ALLOWED_IMAGE_TYPES.includes(mimeType)) {
      throw new Error(`File type ${mimeType} is not allowed`);
    }

    // Validate file size
    if (fileBuffer.length > this.MAX_FILE_SIZE) {
      throw new Error(`File size exceeds maximum allowed size of ${this.MAX_FILE_SIZE} bytes`);
    }

    const fileId = this.generateFileId(fileName);

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: fileId,
      Body: fileBuffer,
      ContentType: mimeType,
      ContentDisposition: "inline", // Display in browser, not download
    });

    await r2Client!.send(command);

    logger.info({ fileId, fileName, fileSize: fileBuffer.length }, "File uploaded successfully");

    // Generate presigned URL for viewing (7 days expiry)
    const fileUrl = await this.getPublicUrl(fileId);

    return {
      fileId,
      fileName,
      fileUrl,
      fileSize: fileBuffer.length,
      mimeType,
      uploadedAt: new Date(),
    };
  }

  /**
   * Generate presigned URL for downloading/viewing a file
   */
  async generatePresignedDownloadUrl(fileId: string, expiresIn: number = 3600): Promise<string> {
    if (!isR2Configured()) {
      throw new Error("R2 is not configured");
    }

    const command = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: fileId,
    });

    const url = await getSignedUrl(r2Client!, command, { expiresIn });

    logger.info({ fileId, expiresIn }, "Generated presigned download URL");

    return url;
  }

  /**
   * Delete a file from R2
   */
  async deleteFile(fileId: string): Promise<void> {
    if (!isR2Configured()) {
      throw new Error("R2 is not configured");
    }

    const command = new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: fileId,
    });

    await r2Client!.send(command);

    logger.info({ fileId }, "File deleted successfully");
  }

  /**
   * Check if a file exists in R2
   */
  async fileExists(fileId: string): Promise<boolean> {
    if (!isR2Configured()) {
      throw new Error("R2 is not configured");
    }

    try {
      const command = new HeadObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: fileId,
      });

      await r2Client!.send(command);
      return true;
    } catch (error: any) {
      if (error.name === "NotFound") {
        return false;
      }
      throw error;
    }
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(
    fileId: string
  ): Promise<{ size: number; contentType: string; lastModified: Date }> {
    if (!isR2Configured()) {
      throw new Error("R2 is not configured");
    }

    const command = new HeadObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: fileId,
    });

    const response = await r2Client!.send(command);

    return {
      size: response.ContentLength || 0,
      contentType: response.ContentType || "",
      lastModified: response.LastModified || new Date(),
    };
  }
}

export const uploadService = new UploadService();
