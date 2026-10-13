import { z } from "zod";

const nameSchema = z.string().trim().min(1).max(200);
const categorySchema = z.string().trim().max(100);
const quantitySchema = z.number().int().min(1).max(99);

export const packingListQuerySchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(50).default(10),
	category: categorySchema.optional(),
	packed: z.enum(["true", "false"]).transform((value) => value === "true").optional(),
	assigned: z.string().trim().min(1).optional(),
}).strict();

export const createPackingItemSchema = z.object({
	name: nameSchema,
	category: categorySchema.optional(),
	quantity: quantitySchema.default(1),
	gearItemId: z.string().trim().min(1).optional(),
	assignedToId: z.string().trim().min(1).optional(),
}).strict();

export const createPackingItemsBulkSchema = z.object({
	items: z.array(createPackingItemSchema).min(1).max(50),
}).strict();

export const updatePackingItemSchema = z.object({
	name: nameSchema.optional(),
	category: categorySchema.nullable().optional(),
	quantity: quantitySchema.optional(),
	gearItemId: z.string().trim().min(1).nullable().optional(),
	assignedToId: z.string().trim().min(1).nullable().optional(),
	isPacked: z.boolean().optional(),
}).strict().refine((item) => Object.keys(item).length > 0, {
	message: "At least one field must be provided",
});

export const packingTripParamsSchema = z.object({
	tripId: z.string().trim().min(1),
}).strict();

export const packingItemParamsSchema = z.object({
	tripId: z.string().trim().min(1),
	itemId: z.string().trim().min(1),
}).strict();
