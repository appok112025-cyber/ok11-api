import { Router } from "express";
import { matchController } from "./matches.controller.js";
import { verifyAdminSession } from "modules/admin/admin.middleware.js";
import { validateBody, validateQuery, validateParams } from "../../shared/middleware/validation.js";
import {
  createMatchSchema,
  updateMatchSchema,
  matchFiltersSchema,
  matchIdParamSchema,
} from "./matches.validators.js";

const router: Router = Router();

/**
 * @route   GET /api/matches
 * @desc    Get all matches with pagination and filters
 * @access  Public
 */
router.get(
  "/",
  validateQuery(matchFiltersSchema),
  matchController.getMatches.bind(matchController)
);

/**
 * @route   GET /api/matches/:id
 * @desc    Get match by ID with populated players
 * @access  Public
 */
router.get(
  "/:id",
  validateParams(matchIdParamSchema),
  matchController.getMatchById.bind(matchController)
);

/**
 * @route   POST /api/matches
 * @desc    Create a new match
 * @access  Admin only
 */
router.post(
  "/",
  verifyAdminSession,
  validateBody(createMatchSchema),
  matchController.createMatch.bind(matchController)
);

/**
 * @route   PUT /api/matches/:id
 * @desc    Update a match
 * @access  Admin only
 */
router.put(
  "/:id",
  verifyAdminSession,
  validateParams(matchIdParamSchema),
  validateBody(updateMatchSchema),
  matchController.updateMatch.bind(matchController)
);

/**
 * @route   DELETE /api/matches/:id
 * @desc    Delete a match
 * @access  Admin only
 */
router.delete(
  "/:id",
  verifyAdminSession,
  validateParams(matchIdParamSchema),
  matchController.deleteMatch.bind(matchController)
);

export default router;
