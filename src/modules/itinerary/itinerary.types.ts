import type { z } from "zod";
import type {
	createItineraryItemSchema,
	itineraryItemParamsSchema,
	itineraryTripParamsSchema,
	reorderItinerarySchema,
	updateItineraryItemSchema,
} from "./itinerary.validation";

export type CreateItineraryItemInput = z.infer<typeof createItineraryItemSchema>;
export type UpdateItineraryItemInput = z.infer<typeof updateItineraryItemSchema>;
export type ReorderItineraryInput = z.infer<typeof reorderItinerarySchema>;
export type ItineraryTripParams = z.infer<typeof itineraryTripParamsSchema>;
export type ItineraryItemParams = z.infer<typeof itineraryItemParamsSchema>;
