import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate";
import { validate } from "../../middlewares/validate";
import { expensesController } from "./expenses.controller";
import {
	createExpenseSchema,
	createSettlementSchema,
	expenseParamsSchema,
	listExpensesQuerySchema,
	settlementListQuerySchema,
	settlementParamsSchema,
	tripExpenseParamsSchema,
	updateExpenseSchema,
} from "./expenses.validation";

export const expensesRouter = Router({ mergeParams: true });

expensesRouter.use(authenticate);
expensesRouter.get(
	"/balances",
	validate({ params: tripExpenseParamsSchema }),
	expensesController.getBalances,
);
expensesRouter.get(
	"/settlements",
	validate({ params: tripExpenseParamsSchema, query: settlementListQuerySchema }),
	expensesController.listSettlements,
);
expensesRouter.post(
	"/settlements",
	validate({ params: tripExpenseParamsSchema, body: createSettlementSchema }),
	expensesController.createSettlement,
);
expensesRouter.delete(
	"/settlements/:settlementId",
	validate({ params: settlementParamsSchema }),
	expensesController.deleteSettlement,
);
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
