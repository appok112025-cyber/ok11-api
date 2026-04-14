import { Router } from "express";
import { faqController } from "./faqs.controller.js";
import { verifyAdminSession } from "modules/admin/admin.middleware.js";
import { validateBody, validateParams } from "../../shared/middleware/validation.js";
import {
  createFAQSchema,
  updateFAQSchema,
  reorderFAQsSchema,
  faqIdParamSchema,
} from "./faqs.validators.js";

const router: Router = Router();

/**
 * @route   GET /api/faqs
 * @desc    Get all FAQs sorted by order
 * @access  Public
 */
router.get("/", faqController.getAllFAQs.bind(faqController));

/**
 * @route   POST /api/faqs
 * @desc    Create a new FAQ
 * @access  Admin only
 */
router.post(
  "/",
  verifyAdminSession,
  validateBody(createFAQSchema),
  faqController.createFAQ.bind(faqController)
);

/**
 * @route   PUT /api/faqs/:id
 * @desc    Update an FAQ
 * @access  Admin only
 */
router.put(
  "/:id",
  verifyAdminSession,
  validateParams(faqIdParamSchema),
  validateBody(updateFAQSchema),
  faqController.updateFAQ.bind(faqController)
);

/**
 * @route   DELETE /api/faqs/:id
 * @desc    Delete an FAQ
 * @access  Admin only
 */
router.delete(
  "/:id",
  verifyAdminSession,
  validateParams(faqIdParamSchema),
  faqController.deleteFAQ.bind(faqController)
);

/**
 * @route   PUT /api/faqs/reorder
 * @desc    Reorder FAQs by updating order values
 * @access  Admin only
 */
router.put(
  "/reorder",
  verifyAdminSession,
  validateBody(reorderFAQsSchema),
  faqController.reorderFAQs.bind(faqController)
);

export default router;
