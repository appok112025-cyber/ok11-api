import { SiteContent, ISiteContent } from "./models/SiteContent.model.js";
import type { UpdateAboutDTO, UpdatePointsDTO, UpdateTermsDTO } from "./site-content.validators.js";
import logger from "../../shared/config/logger.js";

class SiteContentService {
  /**
   * Get all site content (about, points, terms)
   * Returns all 3 documents in a single response
   */
  async getAllSiteContent(): Promise<{
    about: ISiteContent;
    points: ISiteContent;
    terms: ISiteContent;
  }> {
    try {
      const [about, points, terms] = await Promise.all([
        this.getAboutContent(),
        this.getPointsContent(),
        this.getTermsContent(),
      ]);

      return { about, points, terms };
    } catch (error) {
      logger.error({ error }, "Error fetching all site content");
      throw error;
    }
  }

  /**
   * Get About content - ensures only one document exists
   */
  async getAboutContent(): Promise<ISiteContent> {
    try {
      // Use findOneAndUpdate with upsert to ensure only one document exists
      const about = await SiteContent.findOneAndUpdate(
        { type: "about" },
        {
          $setOnInsert: {
            type: "about",
            content: "",
            links: [],
          },
        },
        { upsert: true, new: true }
      );

      return about;
    } catch (error) {
      logger.error({ error }, "Error fetching about content");
      throw error;
    }
  }

  /**
   * Get Points content - ensures only one document exists
   */
  async getPointsContent(): Promise<ISiteContent> {
    try {
      // Use findOneAndUpdate with upsert to ensure only one document exists
      const points = await SiteContent.findOneAndUpdate(
        { type: "points" },
        {
          $setOnInsert: {
            type: "points",
            content: "",
            items: [],
          },
        },
        { upsert: true, new: true }
      );

      return points;
    } catch (error) {
      logger.error({ error }, "Error fetching points content");
      throw error;
    }
  }

  /**
   * Get Terms content - ensures only one document exists
   */
  async getTermsContent(): Promise<ISiteContent> {
    try {
      // Use findOneAndUpdate with upsert to ensure only one document exists
      const terms = await SiteContent.findOneAndUpdate(
        { type: "terms" },
        {
          $setOnInsert: {
            type: "terms",
            content: "",
            items: [],
          },
        },
        { upsert: true, new: true }
      );

      return terms;
    } catch (error) {
      logger.error({ error }, "Error fetching terms content");
      throw error;
    }
  }

  /**
   * Update About page content
   */
  async updateAboutContent(data: UpdateAboutDTO): Promise<ISiteContent> {
    try {
      const about = await SiteContent.findOneAndUpdate(
        { type: "about" },
        {
          $set: {
            content: data.content !== undefined ? data.content : "",
            links: data.links !== undefined ? data.links : [],
          },
          $unset: {
            items: "",
            order: "",
            question: "",
            answer: "",
            email: "",
            password: "",
            role: "",
          },
        },
        { upsert: true, new: true, runValidators: true }
      );

      logger.info("About content updated successfully");
      return about;
    } catch (error) {
      logger.error({ error }, "Error updating about content");
      throw error;
    }
  }

  /**
   * Update Points page content
   * Handles all edge cases:
   * - Empty array (all points deleted) - saves empty array
   * - Adding new points - saves with new items
   * - Updating existing points - saves updated items
   * - Deleting points - saves remaining items
   */
  async updatePointsContent(data: UpdatePointsDTO): Promise<ISiteContent> {
    try {
      // Ensure items is always an array (can be empty)
      const items = Array.isArray(data.items) ? data.items : [];

      const points = await SiteContent.findOneAndUpdate(
        { type: "points" },
        {
          $set: {
            content: data.content !== undefined ? data.content : "",
            items: items, // Can be empty array
          },
          $unset: {
            links: "",
            order: "",
            question: "",
            answer: "",
            email: "",
            password: "",
            role: "",
          },
        },
        { upsert: true, new: true, runValidators: true }
      );

      logger.info({ itemsCount: items.length }, "Points content updated successfully");
      return points;
    } catch (error) {
      logger.error({ error }, "Error updating points content");
      throw error;
    }
  }

  /**
   * Update Terms page content
   */
  async updateTermsContent(data: UpdateTermsDTO): Promise<ISiteContent> {
    try {
      const terms = await SiteContent.findOneAndUpdate(
        { type: "terms" },
        {
          $set: {
            content: data.content !== undefined ? data.content : "",
            items: data.items !== undefined ? data.items : [],
          },
          $unset: {
            links: "",
            order: "",
            question: "",
            answer: "",
            email: "",
            password: "",
            role: "",
          },
        },
        { upsert: true, new: true, runValidators: true }
      );

      logger.info("Terms content updated successfully");
      return terms;
    } catch (error) {
      logger.error({ error }, "Error updating terms content");
      throw error;
    }
  }
}

export const siteContentService = new SiteContentService();
