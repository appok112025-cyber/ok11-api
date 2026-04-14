import notificationRoutes from "./notifications.routes.js";

export default notificationRoutes;

// Export service functions for use in other modules
export { notificationService } from "./notifications.service.js";
export type { CreateNotificationDTO, UpdateNotificationDTO } from "./notifications.service.js";

// Export model and types
export { Notification } from "./models/Notification.model.js";
export type { INotification } from "./models/Notification.model.js";
