import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/ApiResponse";
import { expensesService } from "./expenses.service";
import type {
	CreateExpenseInput,
	CreateSettlementInput,
	ListExpensesQuery,
	SettlementListQuery,
	UpdateExpenseInput,
} from "./expenses.types";

const tripIdFrom = (request: Request): string => request.params.tripId as string;
const expenseIdFrom = (request: Request): string => request.params.expenseId as string;
const userIdFrom = (request: Request): string => request.user!.id;

export const expensesController = {
	getBalances: asyncHandler(async (request: Request, response: Response) => {
		const balances = await expensesService.getBalances(tripIdFrom(request), userIdFrom(request));
		sendSuccess(response, {
			message: "Trip balances fetched successfully",
			data: balances,
		});
	}),

	createSettlement: asyncHandler(async (request: Request, response: Response) => {
		const settlement = await expensesService.createSettlement(
			tripIdFrom(request),
			userIdFrom(request),
			request.body as CreateSettlementInput,
		);
		sendSuccess(response, {
			statusCode: 201,
			message: "Settlement recorded successfully",
			data: settlement,
		});
	}),

	listSettlements: asyncHandler(async (request: Request, response: Response) => {
		const result = await expensesService.listSettlements(
			tripIdFrom(request),
			userIdFrom(request),
			request.query as unknown as SettlementListQuery,
		);
		sendSuccess(response, {
			message: "Settlements fetched successfully",
			data: result.settlements,
			meta: result.meta,
		});
	}),

	deleteSettlement: asyncHandler(async (request: Request, response: Response) => {
		const settlementId = request.params.settlementId as string;
		await expensesService.deleteSettlement(tripIdFrom(request), settlementId, userIdFrom(request));
		sendSuccess(response, {
			message: "Settlement deleted successfully",
			data: { id: settlementId },
		});
	}),

	create: asyncHandler(async (request: Request, response: Response) => {
		const expense = await expensesService.createExpense(
			tripIdFrom(request),
			userIdFrom(request),
			request.body as CreateExpenseInput,
		);
		sendSuccess(response, {
			statusCode: 201,
			message: "Expense created successfully",
			data: expense,
		});
	}),

	list: asyncHandler(async (request: Request, response: Response) => {
		const result = await expensesService.listExpenses(
			tripIdFrom(request),
			userIdFrom(request),
			request.query as unknown as ListExpensesQuery,
		);
		sendSuccess(response, {
			message: "Expenses fetched successfully",
			data: { expenses: result.expenses, summary: result.summary },
			meta: result.meta,
		});
	}),

	get: asyncHandler(async (request: Request, response: Response) => {
		const expense = await expensesService.getExpense(
			tripIdFrom(request),
			expenseIdFrom(request),
			userIdFrom(request),
		);
		sendSuccess(response, {
			message: "Expense fetched successfully",
			data: expense,
		});
	}),

	update: asyncHandler(async (request: Request, response: Response) => {
		const expense = await expensesService.updateExpense(
			tripIdFrom(request),
			expenseIdFrom(request),
			userIdFrom(request),
			request.body as UpdateExpenseInput,
		);
		sendSuccess(response, {
			message: "Expense updated successfully",
			data: expense,
		});
	}),

	remove: asyncHandler(async (request: Request, response: Response) => {
		const expenseId = expenseIdFrom(request);
		await expensesService.deleteExpense(tripIdFrom(request), expenseId, userIdFrom(request));
		sendSuccess(response, {
			message: "Expense deleted successfully",
			data: { id: expenseId },
		});
	}),
};
