import teamRoutes from "./teams.routes.js";

export default teamRoutes;

// Export service functions for use in other modules
export { teamService } from "./teams.service.js";
export type { CreateTeamDTO, UpdateTeamDTO } from "./teams.service.js";

// Export model and types
export { Team } from "./models/Team.model.js";
export type { ITeam } from "./models/Team.model.js";
