import { Request, Response } from "express";
import { faqService } from "./faqs.service.js";
import {
  sendSuccess,
  sendCreated,
  sendNotFound,
  sendNoContent,
} from "../../shared/utils/response.js";
import logger from "../../shared/config/logger.js";

export class FAQController {
  /**
   * Get all FAQs sorted by order
   * Public endpoint
   */
  async getAllFAQs(_req: Request, res: Response): Promise<void> {
    try {
      const faqs = await faqService.getAllFAQs();
      sendSuccess(res, faqs);
    } catch (error) {
      logger.error({ error }, "Error fetching FAQs");
      throw error;
    }
  }

  /**
   * Create a new FAQ
   * Admin only
   */
  async createFAQ(req: Request, res: Response): Promise<void> {
    try {
      const faqData = req.body;
      const faq = await faqService.createFAQ(faqData);
      sendCreated(res, faq);
    } catch (error) {
      logger.error({ error, body: req.body }, "Error creating FAQ");
      throw error;
    }
  }

  /**
   * Update an FAQ
   * Admin only
   */
  async updateFAQ(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const faq = await faqService.updateFAQ(id, updateData);
      sendSuccess(res, faq);
    } catch (error) {
      if (error instanceof Error && error.message === "FAQ not found") {
        sendNotFound(res, "FAQ not found");
        return;
      }
      logger.error({ error, faqId: req.params.id, body: req.body }, "Error updating FAQ");
      throw error;
    }
  }

  /**
   * Delete an FAQ
   * Admin only
   */
  async deleteFAQ(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await faqService.deleteFAQ(id);
      sendNoContent(res);
    } catch (error) {
      if (error instanceof Error && error.message === "FAQ not found") {
        sendNotFound(res, "FAQ not found");
        return;
      }
      logger.error({ error, faqId: req.params.id }, "Error deleting FAQ");
      throw error;
    }
  }

  /**
   * Reorder FAQs
   * Admin only
   */
  async reorderFAQs(req: Request, res: Response): Promise<void> {
    try {
      const { orders } = req.body;
      await faqService.reorderFAQs(orders);
      sendSuccess(res, { message: "FAQs reordered successfully" });
    } catch (error) {
      logger.error({ error, body: req.body }, "Error reordering FAQs");
      throw error;
    }
  }
}

export const faqController = new FAQController();
