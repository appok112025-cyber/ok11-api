// Export admin routes
export { default as adminRoutes } from "./admin.routes.js";

// Export admin middleware
export { verifyAdminSession } from "./admin.middleware.js";

// Export admin services
export {
  initializeDefaultAdmin,
  verifyCredentials,
  generateSessionToken,
  verifySessionToken,
} from "./admin.service.js";

// Export admin model
export { SiteContent } from "../site-content/models/SiteContent.model.js";
export type { ISiteContent } from "../site-content/models/SiteContent.model.js";
