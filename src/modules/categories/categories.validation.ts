import { z } from "zod";

const categoryNameSchema = z.string().trim().min(1).max(100);

export const createCategorySchema = z.object({
	name: categoryNameSchema,
}).strict();

export const updateCategorySchema = z.object({
	name: categoryNameSchema,
}).strict();

export const categoryIdParamsSchema = z.object({
	id: z.string().trim().min(1),
}).strict();