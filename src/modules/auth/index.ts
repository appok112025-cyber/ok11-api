// Export routes
export { default as authRoutes } from "./auth.routes.js";

// Export middleware
export { verifyFirebaseToken } from "./auth.middleware.js";

// Export services
export { authService } from "./auth.service.js";

// Export models
export { User } from "./models/User.model.js";
export type { IUser } from "./models/User.model.js";

// Export controllers
export * from "./auth.controller.js";
