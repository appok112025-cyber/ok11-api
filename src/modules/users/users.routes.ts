import { Router } from "express";
import { userController } from "./users.controller.js";
import { verifyAdminSession } from "modules/admin/admin.middleware.js";
import { validateQuery, validateParams } from "../../shared/middleware/validation.js";
import { getUsersQuerySchema, userIdParamSchema } from "./users.validators.js";

const router: Router = Router();

/**
 * @route   GET /api/users
 * @desc    Get all users with pagination and search
 * @access  Admin only
 */
router.get(
  "/",
  verifyAdminSession,
  validateQuery(getUsersQuerySchema),
  userController.getAllUsers.bind(userController)
);

/**
 * @route   GET /api/users/stats
 * @desc    Get user statistics
 * @access  Admin only
 */
router.get("/stats", verifyAdminSession, userController.getUserStats.bind(userController));

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Admin only
 */
router.get(
  "/:id",
  verifyAdminSession,
  validateParams(userIdParamSchema),
  userController.getUserById.bind(userController)
);

/**
 * @route   PUT /api/users/:id/block
 * @desc    Block a user
 * @access  Admin only
 */
router.put(
  "/:id/block",
  verifyAdminSession,
  validateParams(userIdParamSchema),
  userController.blockUser.bind(userController)
);

/**
 * @route   PUT /api/users/:id/unblock
 * @desc    Unblock a user
 * @access  Admin only
 */
router.put(
  "/:id/unblock",
  verifyAdminSession,
  validateParams(userIdParamSchema),
  userController.unblockUser.bind(userController)
);

export default router;
