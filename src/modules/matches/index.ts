// Export routes
export { default as matchRoutes } from "./matches.routes.js";

// Export services
export { matchService, MatchService } from "./matches.service.js";
export type { CreateMatchDTO, UpdateMatchDTO, MatchFilters } from "./matches.service.js";

// Export models
export { Match } from "./models/Match.model.js";
export type { IMatch, MatchStatus } from "./models/Match.model.js";

// Export validators
export {
  createMatchSchema,
  updateMatchSchema,
  matchFiltersSchema,
  matchIdParamSchema,
} from "./matches.validators.js";

// Export controller
export { matchController, MatchController } from "./matches.controller.js";
