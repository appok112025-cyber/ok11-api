import { SiteContent, ISiteContent } from "../site-content/models/SiteContent.model.js";
import logger from "../../shared/config/logger.js";

export interface CreateFAQDTO {
  order: number;
  question: string;
  answer: string;
}

export interface UpdateFAQDTO {
  order?: number;
  question?: string;
  answer?: string;
}

export interface ReorderItem {
  id: string;
  order: number;
}

class FAQService {
  /**
   * Create a new FAQ
   */
  async createFAQ(data: CreateFAQDTO): Promise<ISiteContent> {
    try {
      const faq = new SiteContent({
        type: "faq",
        order: data.order,
        question: data.question,
        answer: data.answer,
      });
      await faq.save();
      logger.info({ faqId: faq._id }, "FAQ created successfully");
      return faq;
    } catch (error) {
      logger.error({ error, data }, "Error creating FAQ");
      throw error;
    }
  }

  /**
   * Update an existing FAQ
   */
  async updateFAQ(faqId: string, data: UpdateFAQDTO): Promise<ISiteContent> {
    try {
      const faq = await SiteContent.findOneAndUpdate(
        { _id: faqId, type: "faq" },
        {
          $set: data,
          $unset: {
            content: "",
            links: "",
            items: "",
            email: "",
            password: "",
            role: "",
          },
        },
        { new: true, runValidators: true }
      );

      if (!faq) {
        throw new Error("FAQ not found");
      }

      logger.info({ faqId }, "FAQ updated successfully");
      return faq;
    } catch (error) {
      logger.error({ error, faqId, data }, "Error updating FAQ");
      throw error;
    }
  }

  /**
   * Delete an FAQ
   */
  async deleteFAQ(faqId: string): Promise<void> {
    try {
      const faq = await SiteContent.findOneAndDelete({ _id: faqId, type: "faq" });

      if (!faq) {
        throw new Error("FAQ not found");
      }

      logger.info({ faqId }, "FAQ deleted successfully");
    } catch (error) {
      logger.error({ error, faqId }, "Error deleting FAQ");
      throw error;
    }
  }

  /**
   * Get all FAQs sorted by order
   */
  async getAllFAQs(): Promise<ISiteContent[]> {
    try {
      const faqs = await SiteContent.find({ type: "faq" }).sort({ order: 1 });
      return faqs;
    } catch (error) {
      logger.error({ error }, "Error fetching FAQs");
      throw error;
    }
  }

  /**
   * Reorder FAQs by updating order values in bulk
   */
  async reorderFAQs(orders: ReorderItem[]): Promise<void> {
    try {
      const bulkOps = orders.map((item) => ({
        updateOne: {
          filter: { _id: item.id, type: "faq" },
          update: { $set: { order: item.order } },
        },
      }));

      await SiteContent.bulkWrite(bulkOps);
      logger.info({ count: orders.length }, "FAQs reordered successfully");
    } catch (error) {
      logger.error({ error, orders }, "Error reordering FAQs");
      throw error;
    }
  }
}

export const faqService = new FAQService();
