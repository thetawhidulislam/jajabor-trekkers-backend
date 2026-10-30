import { z } from "zod";
import { isCloudinaryImageUrl } from "../../lib/cloudinary";

const difficultySchema = z.enum(["EASY", "MODERATE", "HARD"]);
const statusSchema = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);
const costSchema = z.coerce.number().finite().min(0);

const listQueryShape = {
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(50).default(10),
	search: z.string().trim().max(100).optional(),
	division: z.string().trim().min(1).optional(),
	category: z.string().trim().min(1).optional(),
	difficulty: difficultySchema.optional(),
	minCost: costSchema.optional(),
	maxCost: costSchema.optional(),
	featured: z.enum(["true", "false"]).transform((value) => value === "true").optional(),
	sort: z.enum(["newest", "rating", "cost_asc", "cost_desc"]).default("newest"),
};

const validateCostRange = (
	value: { minCost?: number; maxCost?: number },
	context: z.RefinementCtx,
): void => {
	if (value.minCost !== undefined && value.maxCost !== undefined && value.minCost > value.maxCost) {
		context.addIssue({
			code: "custom",
			path: ["maxCost"],
			message: "maxCost must be greater than or equal to minCost",
		});
	}
};

export const destinationListQuerySchema = z.object(listQueryShape).strict().superRefine(validateCostRange);

export const adminDestinationListQuerySchema = z.object({
	...listQueryShape,
	status: statusSchema.optional(),
}).strict().superRefine(validateCostRange);

const imageSchema = z.object({
	url: z.string().url().refine(isCloudinaryImageUrl, {
		message: "Image URL must be hosted by the configured Cloudinary account",
	}),
	caption: z.string().trim().max(300).optional(),
	sortOrder: z.number().int().min(0).optional(),
}).strict();

const destinationFields = {
	name: z.string().trim().min(1).max(160),
	division: z.string().trim().min(1).max(100),
	district: z.string().trim().max(100).nullable().optional(),
	locationText: z.string().trim().max(500).nullable().optional(),
	latitude: z.number().finite().min(-90).max(90).nullable().optional(),
	longitude: z.number().finite().min(-180).max(180).nullable().optional(),
	description: z.string().trim().min(1),
	coverImage: z.string().url().refine(isCloudinaryImageUrl, {
		message: "Image URL must be hosted by the configured Cloudinary account",
	}),
	estimatedCostMin: costSchema,
	estimatedCostMax: costSchema,
	recommendedDays: z.number().int().min(1),
	bestTimeToVisit: z.string().trim().max(200).nullable().optional(),
	activities: z.array(z.string().trim().min(1).max(200)),
	difficulty: difficultySchema,
	safetyNotes: z.string().trim().max(2000).nullable().optional(),
	permissionRequired: z.boolean().optional(),
	permissionNote: z.string().trim().max(1000).nullable().optional(),
	lastVerifiedAt: z.coerce.date().nullable().optional(),
	categoryId: z.string().trim().min(1),
};

const validateDestination = (
	value: {
		estimatedCostMin?: number;
		estimatedCostMax?: number;
		permissionRequired?: boolean;
		permissionNote?: string | null;
	},
	context: z.RefinementCtx,
): void => {
	if (
		value.estimatedCostMin !== undefined
		&& value.estimatedCostMax !== undefined
		&& value.estimatedCostMin > value.estimatedCostMax
	) {
		context.addIssue({
			code: "custom",
			path: ["estimatedCostMax"],
			message: "estimatedCostMax must be greater than or equal to estimatedCostMin",
		});
	}
	if (value.permissionRequired && !value.permissionNote?.trim()) {
		context.addIssue({
			code: "custom",
			path: ["permissionNote"],
			message: "permissionNote is required when permissionRequired is true",
		});
	}
};

export const createDestinationSchema = z.object({
	...destinationFields,
	status: statusSchema.optional(),
	images: z.array(imageSchema).optional(),
}).strict().superRefine(validateDestination);

export const updateDestinationSchema = z.object({
	name: destinationFields.name.optional(),
	slug: z.string().trim().min(1).max(180).optional(),
	division: destinationFields.division.optional(),
	district: destinationFields.district,
	locationText: destinationFields.locationText,
	latitude: destinationFields.latitude,
	longitude: destinationFields.longitude,
	description: destinationFields.description.optional(),
	coverImage: destinationFields.coverImage.optional(),
	estimatedCostMin: destinationFields.estimatedCostMin.optional(),
	estimatedCostMax: destinationFields.estimatedCostMax.optional(),
	recommendedDays: destinationFields.recommendedDays.optional(),
	bestTimeToVisit: destinationFields.bestTimeToVisit,
	activities: destinationFields.activities.optional(),
	difficulty: destinationFields.difficulty.optional(),
	safetyNotes: destinationFields.safetyNotes,
	permissionRequired: destinationFields.permissionRequired.optional(),
	permissionNote: destinationFields.permissionNote,
	lastVerifiedAt: destinationFields.lastVerifiedAt,
	categoryId: destinationFields.categoryId.optional(),
	images: z.array(imageSchema).optional(),
}).strict().superRefine(validateDestination);

export const updateDestinationStatusSchema = z.object({
	status: statusSchema,
}).strict();

export const updateDestinationFeaturedSchema = z.object({
	isFeatured: z.boolean(),
}).strict();

export const destinationSlugParamsSchema = z.object({
	slug: z.string().trim().min(1),
}).strict();

export const destinationIdParamsSchema = z.object({
	id: z.string().trim().min(1),
}).strict();
