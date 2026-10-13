import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate";
import { validate } from "../../middlewares/validate";
import { expensesController } from "./expenses.controller";
import {
	createExpenseSchema,
	expenseParamsSchema,
	listExpensesQuerySchema,
	tripExpenseParamsSchema,
	updateExpenseSchema,
} from "./expenses.validation";

export const expensesRouter = Router({ mergeParams: true });

expensesRouter.use(authenticate);
expensesRouter.post(
	"/",
	validate({ params: tripExpenseParamsSchema, body: createExpenseSchema }),
	expensesController.create,
);
expensesRouter.get(
	"/",
	validate({ params: tripExpenseParamsSchema, query: listExpensesQuerySchema }),
	expensesController.list,
);
expensesRouter.get(
	"/:expenseId",
	validate({ params: expenseParamsSchema }),
	expensesController.get,
);
expensesRouter.patch(
	"/:expenseId",
	validate({ params: expenseParamsSchema, body: updateExpenseSchema }),
	expensesController.update,
);
expensesRouter.delete(
	"/:expenseId",
	validate({ params: expenseParamsSchema }),
	expensesController.remove,
);
