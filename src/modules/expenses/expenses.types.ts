import type { z } from "zod";
import type {
	createExpenseSchema,
	expenseParamsSchema,
	listExpensesQuerySchema,
	tripExpenseParamsSchema,
	updateExpenseSchema,
} from "./expenses.validation";

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type ListExpensesQuery = z.infer<typeof listExpensesQuerySchema>;
export type TripExpenseParams = z.infer<typeof tripExpenseParamsSchema>;
export type ExpenseParams = z.infer<typeof expenseParamsSchema>;
