import userRoutes from "./users.routes.js";

export default userRoutes;

// Export service functions for use in other modules
export { userService } from "./users.service.js";
export type { UserStats } from "./users.service.js";

// Export controller
export { userController, UserController } from "./users.controller.js";

// Export validators
export { getUsersQuerySchema, userIdParamSchema } from "./users.validators.js";
