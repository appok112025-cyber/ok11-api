// Export routes
export { default as submissionRoutes } from "./submissions.routes.js";

// Export services
export { submissionService, SubmissionService } from "./submissions.service.js";
export type { CreateSubmissionDTO, UpdateSubmissionDTO } from "./submissions.service.js";

// Export models
export { Submission } from "./models/Submission.model.js";
export type { ISubmission, IQuizAnswer, SubmissionStatus } from "./models/Submission.model.js";

// Export validators
export {
  createSubmissionSchema,
  updateSubmissionSchema,
  submissionIdParamSchema,
  userIdParamSchema,
  matchIdParamSchema,
  submissionFiltersSchema,
} from "./submissions.validators.js";

// Export controller
export { submissionController, SubmissionController } from "./submissions.controller.js";
