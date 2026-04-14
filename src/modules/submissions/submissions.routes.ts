import { Router } from "express";
import { submissionController } from "./submissions.controller.js";
import { verifyFirebaseToken } from "modules/auth/auth.middleware.js";
import { verifyAdminSession } from "modules/admin/admin.middleware.js";
import { allowUserOrAdmin } from "../../shared/middleware/auth.js";
import { validateBody, validateQuery, validateParams } from "../../shared/middleware/validation.js";
import {
  createSubmissionSchema,
  updateSubmissionSchema,
  submissionIdParamSchema,
  userIdParamSchema,
  matchIdParamSchema,
  submissionFiltersSchema,
} from "./submissions.validators.js";

const router: Router = Router();

/**
 * @route   GET /api/submissions
 * @desc    Get all submissions with filters and pagination
 * @access  Admin only
 */
router.get(
  "/",
  verifyAdminSession,
  validateQuery(submissionFiltersSchema),
  submissionController.getSubmissions.bind(submissionController)
);

/**
 * @route   GET /api/submissions/me
 * @desc    Get current user's submission history
 * @access  User only
 */
router.get(
  "/me",
  verifyFirebaseToken,
  submissionController.getCurrentUserSubmissions.bind(submissionController)
);

/**
 * @route   GET /api/submissions/user/match/:matchId
 * @desc    Get current user's submission for a specific match
 * @access  User only
 */
router.get(
  "/user/match/:matchId",
  verifyFirebaseToken,
  validateParams(matchIdParamSchema),
  submissionController.getUserSubmissionForMatch.bind(submissionController)
);

/**
 * @route   GET /api/submissions/user/:userId
 * @desc    Get submissions by user
 * @access  User (own) or Admin
 */
router.get(
  "/user/:userId",
  allowUserOrAdmin,
  validateParams(userIdParamSchema),
  submissionController.getUserSubmissions.bind(submissionController)
);

/**
 * @route   GET /api/submissions/match/:matchId
 * @desc    Get submissions by match
 * @access  Admin only
 */
router.get(
  "/match/:matchId",
  verifyAdminSession,
  validateParams(matchIdParamSchema),
  submissionController.getMatchSubmissions.bind(submissionController)
);

/**
 * @route   GET /api/submissions/:id
 * @desc    Get submission by ID
 * @access  User (own) or Admin
 */
router.get(
  "/:id",
  allowUserOrAdmin,
  validateParams(submissionIdParamSchema),
  submissionController.getSubmissionById.bind(submissionController)
);

/**
 * @route   POST /api/submissions
 * @desc    Create a new submission
 * @access  User only
 */
router.post(
  "/",
  verifyFirebaseToken,
  validateBody(createSubmissionSchema),
  submissionController.createSubmission.bind(submissionController)
);

/**
 * @route   PUT /api/submissions/:id
 * @desc    Update a submission
 * @access  User (own) only
 */
router.put(
  "/:id",
  verifyFirebaseToken,
  validateParams(submissionIdParamSchema),
  validateBody(updateSubmissionSchema),
  submissionController.updateSubmission.bind(submissionController)
);

/**
 * @route   PUT /api/submissions/:id/evaluate
 * @desc    Evaluate a submission
 * @access  Admin only
 */
router.put(
  "/:id/evaluate",
  verifyAdminSession,
  validateParams(submissionIdParamSchema),
  submissionController.evaluateSubmission.bind(submissionController)
);

/**
 * @route   PUT /api/submissions/match/:matchId/evaluate
 * @desc    Re-evaluate all submissions for a match
 * @access  Admin only
 */
router.put(
  "/match/:matchId/evaluate",
  verifyAdminSession,
  validateParams(matchIdParamSchema),
  submissionController.evaluateMatchSubmissions.bind(submissionController)
);

export default router;
