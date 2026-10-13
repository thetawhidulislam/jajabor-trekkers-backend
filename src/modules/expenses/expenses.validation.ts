import { z } from "zod";
import { fromMinor, toMinor } from "./expenses.money";

const categorySchema = z.enum(["TRANSPORT", "FOOD", "STAY", "ACTIVITY", "GEAR", "OTHER"]);
const amountHasAtMostTwoDecimals = (amount: number): boolean => {
	try {
		return fromMinor(toMinor(amount)) === amount;
	} catch {
		return false;
	}
};

const expenseAmountSchema = z.number()
	.finite()
	.positive()
	.refine(amountHasAtMostTwoDecimals, "amount must have at most 2 decimal places");

const shareAmountSchema = z.number()
	.finite()
	.min(0)
	.refine(amountHasAtMostTwoDecimals, "share amount must have at most 2 decimal places");

const splitSchema = z.discriminatedUnion("type", [
	z.object({
		type: z.literal("EQUAL"),
		participantIds: z.array(z.string().trim().min(1)).min(1),
	}).strict(),
	z.object({
		type: z.literal("EXACT"),
		shares: z.array(z.object({
			userId: z.string().trim().min(1),
			amount: shareAmountSchema,
		}).strict()).min(1),
	}).strict(),
]);

const expenseFields = {
	title: z.string().trim().min(1).max(200),
	amount: expenseAmountSchema,
	category: categorySchema.default("OTHER"),
	paidById: z.string().trim().min(1).optional(),
	expenseDate: z.coerce.date().optional(),
	note: z.string().trim().max(2000).optional(),
};

export const createExpenseSchema = z.object({
	...expenseFields,
	split: splitSchema,
}).strict();

export const updateExpenseSchema = z.object({
	title: expenseFields.title.optional(),
	amount: expenseAmountSchema.optional(),
	category: categorySchema.optional(),
	paidById: expenseFields.paidById,
	expenseDate: expenseFields.expenseDate,
	note: expenseFields.note,
	split: splitSchema.optional(),
}).strict().refine((expense) => Object.keys(expense).length > 0, {
	message: "At least one field must be provided",
});

export const listExpensesQuerySchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(50).default(10),
	category: categorySchema.optional(),
	paidById: z.string().trim().min(1).optional(),
	sort: z.enum(["newest"]).default("newest"),
}).strict();

export const tripExpenseParamsSchema = z.object({
	tripId: z.string().trim().min(1),
}).strict();

export const expenseParamsSchema = z.object({
	tripId: z.string().trim().min(1),
	expenseId: z.string().trim().min(1),
}).strict();
