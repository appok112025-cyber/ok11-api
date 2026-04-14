import { Router } from "express";
import { quizController } from "./quizzes.controller.js";
import { verifyAdminSession } from "modules/admin/admin.middleware.js";
import { allowUserOrAdmin } from "../../shared/middleware/auth.js";
import { validateBody, validateParams } from "../../shared/middleware/validation.js";
import {
  createQuizSchema,
  updateQuizSchema,
  matchIdParamSchema,
  quizIdParamSchema,
} from "./quizzes.validators.js";

const router: Router = Router();

/**
 * @route   GET /api/quizzes
 * @desc    Get all quizzes (admin only)
 * @access  Admin only
 */
router.get("/", verifyAdminSession, quizController.getAllQuizzes.bind(quizController));

/**
 * @route   GET /api/quizzes/match/:matchId
 * @desc    Get quizzes for a specific match
 * @access  User or Admin (correctAnswer hidden for users)
 */
router.get(
  "/match/:matchId",
  validateParams(matchIdParamSchema),
  allowUserOrAdmin,
  quizController.getQuizzesByMatch.bind(quizController)
);

/**
 * @route   POST /api/quizzes
 * @desc    Create a new quiz
 * @access  Admin only
 */
router.post(
  "/",
  verifyAdminSession,
  validateBody(createQuizSchema),
  quizController.createQuiz.bind(quizController)
);

/**
 * @route   PUT /api/quizzes/:id
 * @desc    Update a quiz
 * @access  Admin only
 */
router.put(
  "/:id",
  verifyAdminSession,
  validateParams(quizIdParamSchema),
  validateBody(updateQuizSchema),
  quizController.updateQuiz.bind(quizController)
);

/**
 * @route   DELETE /api/quizzes/:id
 * @desc    Delete a quiz
 * @access  Admin only
 */
router.delete(
  "/:id",
  verifyAdminSession,
  validateParams(quizIdParamSchema),
  quizController.deleteQuiz.bind(quizController)
);

export default router;
