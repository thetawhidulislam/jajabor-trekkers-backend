import { z } from "zod";

const ratingSchema = z.number().int().min(1).max(5);
const commentSchema = z.string().trim().min(1).max(1000);
const paginationShape = {
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(50).default(10),
};

export const publicReviewsQuerySchema = z.object(paginationShape).strict();

export const createReviewSchema = z.object({
	rating: ratingSchema,
	comment: commentSchema.optional(),
}).strict();

export const updateReviewSchema = z.object({
	rating: ratingSchema.optional(),
	comment: commentSchema.optional(),
}).strict().refine((review) => Object.keys(review).length > 0, {
	message: "At least one field must be provided",
});

export const adminReviewsQuerySchema = z.object({
	...paginationShape,
	isHidden: z.enum(["true", "false"]).transform((value) => value === "true").optional(),
	destinationId: z.string().trim().min(1).optional(),
	rating: z.coerce.number().int().min(1).max(5).optional(),
}).strict();

export const updateReviewVisibilitySchema = z.object({
	isHidden: z.boolean(),
}).strict();

export const destinationSlugParamsSchema = z.object({
	slug: z.string().trim().min(1),
}).strict();

export const reviewIdParamsSchema = z.object({
	id: z.string().trim().min(1),
}).strict();
