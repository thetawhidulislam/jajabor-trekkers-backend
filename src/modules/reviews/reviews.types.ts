import type { z } from "zod";
import type {
	adminReviewsQuerySchema,
	createReviewSchema,
	destinationSlugParamsSchema,
	publicReviewsQuerySchema,
	reviewIdParamsSchema,
	updateReviewSchema,
	updateReviewVisibilitySchema,
} from "./reviews.validation";

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
export type UpdateReviewVisibilityInput = z.infer<typeof updateReviewVisibilitySchema>;
export type PublicReviewsQuery = z.infer<typeof publicReviewsQuerySchema>;
export type AdminReviewsQuery = z.infer<typeof adminReviewsQuerySchema>;
export type DestinationSlugParams = z.infer<typeof destinationSlugParamsSchema>;
export type ReviewIdParams = z.infer<typeof reviewIdParamsSchema>;
