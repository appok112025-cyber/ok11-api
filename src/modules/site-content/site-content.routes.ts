import { Router } from "express";
import { siteContentController } from "./site-content.controller.js";
import { verifyAdminSession } from "modules/admin/admin.middleware.js";
import { validateBody } from "../../shared/middleware/validation.js";
import {
  updateAboutSchema,
  updatePointsSchema,
  updateTermsSchema,
} from "./site-content.validators.js";

const router: Router = Router();

/**
 * @route   GET /api/site-content
 * @desc    Get all site content (About, Terms, Points) - returns all 3 documents
 * @access  Public
 */
router.get("/", siteContentController.getAllSiteContent.bind(siteContentController));

/**
 * @route   GET /api/site-content/about
 * @desc    Get About content
 * @access  Public
 */
router.get("/about", siteContentController.getAboutContent.bind(siteContentController));

/**
 * @route   GET /api/site-content/points
 * @desc    Get Points content
 * @access  Public
 */
router.get("/points", siteContentController.getPointsContent.bind(siteContentController));

/**
 * @route   GET /api/site-content/terms
 * @desc    Get Terms content
 * @access  Public
 */
router.get("/terms", siteContentController.getTermsContent.bind(siteContentController));

/**
 * @route   PUT /api/site-content/about
 * @desc    Update About page content
 * @access  Admin only
 */
router.put(
  "/about",
  verifyAdminSession,
  validateBody(updateAboutSchema),
  siteContentController.updateAboutContent.bind(siteContentController)
);

/**
 * @route   PUT /api/site-content/points
 * @desc    Update Points page content
 * @access  Admin only
 */
router.put(
  "/points",
  verifyAdminSession,
  validateBody(updatePointsSchema),
  siteContentController.updatePointsContent.bind(siteContentController)
);

/**
 * @route   PUT /api/site-content/terms
 * @desc    Update Terms page content
 * @access  Admin only
 */
router.put(
  "/terms",
  verifyAdminSession,
  validateBody(updateTermsSchema),
  siteContentController.updateTermsContent.bind(siteContentController)
);

export default router;
