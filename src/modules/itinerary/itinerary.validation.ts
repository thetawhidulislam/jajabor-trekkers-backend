import { z } from "zod";

const startTimeSchema = z.string().regex(
	/^(?:[01]\d|2[0-3]):[0-5]\d$/,
	"startTime must use 24-hour HH:mm format",
);

const itineraryFields = {
	dayNumber: z.number().int().min(1),
	startTime: startTimeSchema.optional(),
	title: z.string().trim().min(1).max(160),
	description: z.string().trim().max(4000).optional(),
	location: z.string().trim().max(500).optional(),
	estimatedCost: z.number().finite().min(0).optional(),
	sortOrder: z.number().int().min(0).optional(),
};

export const createItineraryItemSchema = z.object(itineraryFields).strict();

export const updateItineraryItemSchema = z.object({
	dayNumber: itineraryFields.dayNumber.optional(),
	startTime: itineraryFields.startTime,
	title: itineraryFields.title.optional(),
	description: itineraryFields.description,
	location: itineraryFields.location,
	estimatedCost: itineraryFields.estimatedCost,
	sortOrder: itineraryFields.sortOrder,
}).strict().refine((item) => Object.keys(item).length > 0, {
	message: "At least one field must be provided",
});

export const reorderItinerarySchema = z.object({
	dayNumber: z.number().int().min(1),
	itemIds: z.array(z.string().trim().min(1)).refine(
		(itemIds) => new Set(itemIds).size === itemIds.length,
		"itemIds must not contain duplicates",
	),
}).strict();

export const itineraryTripParamsSchema = z.object({
	tripId: z.string().trim().min(1),
}).strict();

export const itineraryItemParamsSchema = z.object({
	tripId: z.string().trim().min(1),
	itemId: z.string().trim().min(1),
}).strict();
