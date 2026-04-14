import { Request, Response } from "express";
import { siteContentService } from "./site-content.service.js";
import { sendSuccess } from "../../shared/utils/response.js";
import logger from "../../shared/config/logger.js";

export class SiteContentController {
  /**
   * Get all site content (about, points, terms)
   * Public endpoint - returns all 3 documents
   */
  async getAllSiteContent(_req: Request, res: Response): Promise<void> {
    try {
      const siteContent = await siteContentService.getAllSiteContent();
      sendSuccess(res, siteContent);
    } catch (error) {
      logger.error({ error }, "Error fetching site content");
      throw error;
    }
  }

  /**
   * Get About content
   * Public endpoint
   */
  async getAboutContent(_req: Request, res: Response): Promise<void> {
    try {
      const about = await siteContentService.getAboutContent();
      sendSuccess(res, about);
    } catch (error) {
      logger.error({ error }, "Error fetching about content");
      throw error;
    }
  }

  /**
   * Get Points content
   * Public endpoint
   */
  async getPointsContent(_req: Request, res: Response): Promise<void> {
    try {
      const points = await siteContentService.getPointsContent();
      sendSuccess(res, points);
    } catch (error) {
      logger.error({ error }, "Error fetching points content");
      throw error;
    }
  }

  /**
   * Get Terms content
   * Public endpoint
   */
  async getTermsContent(_req: Request, res: Response): Promise<void> {
    try {
      const terms = await siteContentService.getTermsContent();
      sendSuccess(res, terms);
    } catch (error) {
      logger.error({ error }, "Error fetching terms content");
      throw error;
    }
  }

  /**
   * Update About page content
   * Admin only
   */
  async updateAboutContent(req: Request, res: Response): Promise<void> {
    try {
      const { content, links } = req.body;
      const validLinks = Array.isArray(links)
        ? links.filter((link: any) => link?.title?.trim() && link?.url?.trim())
        : [];

      const about = await siteContentService.updateAboutContent({
        content: content || "",
        links: validLinks,
      });
      sendSuccess(res, about);
    } catch (error) {
      logger.error({ error, body: req.body }, "Error updating about content");
      throw error;
    }
  }

  /**
   * Update Points page content
   * Admin only
   * Handles all edge cases:
   * - Empty array (all points deleted)
   * - Adding new points
   * - Updating existing points
   * - Deleting points
   */
  async updatePointsContent(req: Request, res: Response): Promise<void> {
    try {
      const { content, items } = req.body;

      // Ensure items is always an array
      let validItems: any[] = [];

      if (Array.isArray(items)) {
        // Filter out items with empty title or description (incomplete items)
        // This allows empty arrays to pass through (all points deleted)
        validItems = items.filter((item: any) => {
          const hasTitle = item?.title?.trim();
          const hasDescription = item?.description?.trim();
          // Keep items that have both title and description, or allow empty array
          return hasTitle && hasDescription;
        });
      }

      const points = await siteContentService.updatePointsContent({
        content: content !== undefined ? content || "" : "",
        items: validItems,
      });
      sendSuccess(res, points);
    } catch (error) {
      logger.error({ error, body: req.body }, "Error updating points content");
      throw error;
    }
  }

  /**
   * Update Terms page content
   * Admin only
   */
  async updateTermsContent(req: Request, res: Response): Promise<void> {
    try {
      const { content, items } = req.body;
      const validItems = Array.isArray(items)
        ? items.filter((item: any) => item?.title?.trim() && item?.description?.trim())
        : [];

      const terms = await siteContentService.updateTermsContent({
        content: content || "",
        items: validItems,
      });
      sendSuccess(res, terms);
    } catch (error) {
      logger.error({ error, body: req.body }, "Error updating terms content");
      throw error;
    }
  }
}

export const siteContentController = new SiteContentController();
