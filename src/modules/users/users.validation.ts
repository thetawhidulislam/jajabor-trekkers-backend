import { z } from "zod";

export const getUsersQuerySchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(50).default(10),
	search: z.string().trim().optional(),
}).strict();

export const updateMeSchema = z
	.object({
		name: z.string().trim().min(1).max(100).optional(),
		phone: z.string().trim().max(20).optional(),
		image: z.string().url().optional(),
	})
	.strict();
