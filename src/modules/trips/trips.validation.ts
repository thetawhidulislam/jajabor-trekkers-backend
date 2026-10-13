import { z } from "zod";

const tripStatusSchema = z.enum(["PLANNING", "UPCOMING", "ONGOING", "COMPLETED", "CANCELLED"]);
const paginationShape = {
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(50).default(10),
};

export const listTripsQuerySchema = z.object({
	...paginationShape,
	status: tripStatusSchema.optional(),
	sort: z.enum(["startDate_asc", "startDate_desc", "newest"]).default("startDate_asc"),
}).strict();

export const listInvitationsQuerySchema = z.object(paginationShape).strict();
export const listMembersQuerySchema = z.object(paginationShape).strict();

const validateDates = (
	value: { startDate?: Date; endDate?: Date },
	context: z.RefinementCtx,
): void => {
	if (value.startDate && value.endDate && value.endDate < value.startDate) {
		context.addIssue({
			code: "custom",
			path: ["endDate"],
			message: "endDate must be on or after startDate",
		});
	}
};

export const createTripSchema = z.object({
	title: z.string().trim().min(1).max(160),
	destinationId: z.string().trim().min(1).optional(),
	startDate: z.coerce.date(),
	endDate: z.coerce.date(),
	budget: z.coerce.number().finite().min(0).optional(),
	notes: z.string().trim().max(4000).optional(),
}).strict().superRefine((trip, context) => {
	validateDates(trip, context);
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	if (trip.startDate < today) {
		context.addIssue({
			code: "custom",
			path: ["startDate"],
			message: "startDate must be today or later",
		});
	}
});

export const updateTripSchema = z.object({
	title: z.string().trim().min(1).max(160).optional(),
	destinationId: z.string().trim().min(1).nullable().optional(),
	startDate: z.coerce.date().optional(),
	endDate: z.coerce.date().optional(),
	budget: z.coerce.number().finite().min(0).nullable().optional(),
	notes: z.string().trim().max(4000).nullable().optional(),
}).strict().superRefine(validateDates);

export const updateTripStatusSchema = z.object({
	status: tripStatusSchema,
}).strict();

export const inviteMemberSchema = z.object({
	email: z.string().trim().email().max(254),
}).strict();

export const respondInvitationSchema = z.object({
	action: z.enum(["accept", "decline"]),
}).strict();

export const tripIdParamsSchema = z.object({
	id: z.string().trim().min(1),
}).strict();

export const tripMemberParamsSchema = z.object({
	id: z.string().trim().min(1),
	userId: z.string().trim().min(1),
}).strict();
