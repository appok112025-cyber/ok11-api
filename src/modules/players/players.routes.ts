import { Router } from "express";
import { playerController } from "./players.controller.js";
import { verifyAdminSession } from "modules/admin/admin.middleware.js";
import { validateBody, validateParams } from "shared/middleware/validation.js";
import {
  createPlayerSchema,
  updatePlayerSchema,
  playerIdParamSchema,
} from "./players.validators.js";

const router: Router = Router();

/**
 * @route   GET /api/players
 * @desc    Get all players
 * @access  Public
 */
router.get("/", playerController.getAllPlayers.bind(playerController));

/**
 * @route   POST /api/players
 * @desc    Create a new player
 * @access  Admin only
 */
router.post(
  "/",
  verifyAdminSession,
  validateBody(createPlayerSchema),
  playerController.createPlayer.bind(playerController)
);

/**
 * @route   PUT /api/players/:id
 * @desc    Update a player
 * @access  Admin only
 */
router.put(
  "/:id",
  verifyAdminSession,
  validateParams(playerIdParamSchema),
  validateBody(updatePlayerSchema),
  playerController.updatePlayer.bind(playerController)
);

/**
 * @route   DELETE /api/players/:id
 * @desc    Delete a player
 * @access  Admin only
 */
router.delete(
  "/:id",
  verifyAdminSession,
  validateParams(playerIdParamSchema),
  playerController.deletePlayer.bind(playerController)
);

export default router;
