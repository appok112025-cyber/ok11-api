import playerRoutes from "./players.routes.js";

export default playerRoutes;

// Export service functions for use in other modules
export { playerService, PlayerService } from "./players.service.js";
export type { CreatePlayerDTO, UpdatePlayerDTO } from "./players.service.js";

// Export model and types
export { Player } from "./models/Player.model.js";
export type { IPlayer } from "./models/Player.model.js";

// Export controller
export { playerController, PlayerController } from "./players.controller.js";
