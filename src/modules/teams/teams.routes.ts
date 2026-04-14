import { Router } from "express";
import { teamController } from "./teams.controller.js";
import { verifyAdminSession } from "modules/admin/admin.middleware.js";
import { validateBody, validateParams } from "../../shared/middleware/validation.js";
import { createTeamSchema, updateTeamSchema, teamIdParamSchema } from "./teams.validators.js";

const router: Router = Router();

/**
 * @route   GET /api/teams
 * @desc    Get all teams
 * @access  Public
 */
router.get("/", teamController.getAllTeams.bind(teamController));

/**
 * @route   GET /api/teams/:id
 * @desc    Get team by ID
 * @access  Public
 */
router.get(
  "/:id",
  validateParams(teamIdParamSchema),
  teamController.getTeamById.bind(teamController)
);

/**
 * @route   POST /api/teams
 * @desc    Create a new team
 * @access  Admin only
 */
router.post(
  "/",
  verifyAdminSession,
  validateBody(createTeamSchema),
  teamController.createTeam.bind(teamController)
);

router.post(
  "/image-upload-url",
  verifyAdminSession,
  teamController.getTeamImageUploadUrl.bind(teamController)
);

/**
 * @route   PUT /api/teams/:id
 * @desc    Update a team
 * @access  Admin only
 */
router.put(
  "/:id",
  verifyAdminSession,
  validateParams(teamIdParamSchema),
  validateBody(updateTeamSchema),
  teamController.updateTeam.bind(teamController)
);

/**
 * @route   DELETE /api/teams/:id
 * @desc    Delete a team
 * @access  Admin only
 */
router.delete(
  "/:id",
  verifyAdminSession,
  validateParams(teamIdParamSchema),
  teamController.deleteTeam.bind(teamController)
);

export default router;
