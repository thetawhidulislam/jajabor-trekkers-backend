import type { z } from "zod";
import type {
	adminDestinationListQuerySchema,
	createDestinationSchema,
	destinationListQuerySchema,
	updateDestinationFeaturedSchema,
	updateDestinationSchema,
	updateDestinationStatusSchema,
} from "./destinations.validation";

export type DestinationListQuery = z.infer<typeof destinationListQuerySchema>;
export type AdminDestinationListQuery = z.infer<typeof adminDestinationListQuerySchema>;
export type CreateDestinationInput = z.infer<typeof createDestinationSchema>;
export type UpdateDestinationInput = z.infer<typeof updateDestinationSchema>;
export type UpdateDestinationStatusInput = z.infer<typeof updateDestinationStatusSchema>;
export type UpdateDestinationFeaturedInput = z.infer<typeof updateDestinationFeaturedSchema>;
export type DestinationStatusValue = UpdateDestinationStatusInput["status"];
export type DestinationSort = DestinationListQuery["sort"];
