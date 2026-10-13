import { ApiError } from "../../utils/ApiError";
import { buildMeta, getPagination } from "../../utils/pagination";
import { assertTripAccess } from "../trips/trips.service";
import {
	createExpenseWithSplits,
	deleteExpense as removeExpense,
	findAcceptedMemberIds,
	findExpenseById,
	findExpenses,
	updateExpense as saveExpense,
} from "./expenses.repository";
import { fromMinor, splitEqual, toMinor, validateExactShares } from "./expenses.money";
import type { Share } from "./expenses.money";
import type { CreateExpenseInput, ListExpensesQuery, UpdateExpenseInput } from "./expenses.types";

const isPrismaError = (error: unknown, code: string): boolean =>
	typeof error === "object" && error !== null && "code" in error && error.code === code;

const toMinorSafely = (amount: number | string, field: string): number => {
	try {
		return toMinor(amount);
	} catch (error) {
		throw ApiError.badRequest(error instanceof Error ? error.message : `${field} is invalid`);
	}
};

const mapExpense = (expense: NonNullable<Awaited<ReturnType<typeof findExpenseById>>>) => ({
	id: expense.id,
	title: expense.title,
	amount: fromMinor(toMinorSafely(expense.amount.toString(), "amount")),
	category: expense.category,
	expenseDate: expense.expenseDate,
	note: expense.note,
	paidBy: expense.paidBy,
	splits: expense.splits.map((split) => ({
		user: split.user,
		amount: fromMinor(toMinorSafely(split.amount.toString(), "split amount")),
	})),
	createdAt: expense.createdAt,
	updatedAt: expense.updatedAt,
});

const assertWritableTrip = async (tripId: string, userId: string) => {
	const access = await assertTripAccess(tripId, userId);
	if (access.trip.status === "CANCELLED") {
		throw ApiError.conflict("Expenses cannot be changed for a cancelled trip");
	}
	return access;
};

const assertAcceptedMembers = async (tripId: string, participantIds: string[]): Promise<void> => {
	const acceptedIds = await findAcceptedMemberIds(tripId, participantIds);
	if (acceptedIds.length !== participantIds.length) {
		throw ApiError.badRequest("All expense participants must be accepted members of this trip");
	}
};

const createShares = async (
	tripId: string,
	split: CreateExpenseInput["split"],
	totalMinor: number,
): Promise<Share[]> => {
	let shares: Share[];
	try {
		if (split.type === "EQUAL") {
			shares = splitEqual(totalMinor, split.participantIds);
		} else {
			shares = split.shares.map((share) => ({
				userId: share.userId,
				amountMinor: toMinor(share.amount),
			}));
			validateExactShares(totalMinor, shares);
		}
	} catch (error) {
		throw ApiError.badRequest(error instanceof Error ? error.message : "Invalid expense split");
	}
	await assertAcceptedMembers(tripId, shares.map((share) => share.userId));
	return shares;
};

const validatePayer = async (tripId: string, paidById: string): Promise<void> => {
	await assertAcceptedMembers(tripId, [paidById]);
};

export const expensesService = {
	async createExpense(tripId: string, userId: string, input: CreateExpenseInput) {
		await assertWritableTrip(tripId, userId);
		const amountMinor = toMinorSafely(input.amount, "amount");
		const paidById = input.paidById ?? userId;
		await validatePayer(tripId, paidById);
		const shares = await createShares(tripId, input.split, amountMinor);
		try {
			const expense = await createExpenseWithSplits({
				tripId,
				title: input.title,
				amountMinor,
				category: input.category,
				paidById,
				expenseDate: input.expenseDate ?? new Date(),
				note: input.note,
				shares,
			});
			return mapExpense(expense);
		} catch (error) {
			if (isPrismaError(error, "P2003")) {
				throw ApiError.badRequest("Payer and split participants must be registered trip members");
			}
			throw error;
		}
	},

	async listExpenses(tripId: string, userId: string, query: ListExpensesQuery) {
		await assertTripAccess(tripId, userId);
		const pagination = getPagination({ page: query.page, limit: query.limit });
		const result = await findExpenses({
			tripId,
			category: query.category,
			paidById: query.paidById,
			skip: pagination.skip,
			take: pagination.limit,
		});
		const totalSpent = result.summaryAmount === null
			? 0
			: fromMinor(toMinorSafely(result.summaryAmount.toString(), "totalSpent"));
		return {
			expenses: result.expenses.map(mapExpense),
			meta: buildMeta(result.total, pagination.page, pagination.limit),
			summary: { totalSpent, count: result.summaryCount },
		};
	},

	async getExpense(tripId: string, expenseId: string, userId: string) {
		await assertTripAccess(tripId, userId);
		const expense = await findExpenseById(tripId, expenseId);
		if (!expense) {
			throw ApiError.notFound("Expense not found");
		}
		return mapExpense(expense);
	},

	async updateExpense(tripId: string, expenseId: string, userId: string, input: UpdateExpenseInput) {
		const { member } = await assertWritableTrip(tripId, userId);
		const existing = await findExpenseById(tripId, expenseId);
		if (!existing) {
			throw ApiError.notFound("Expense not found");
		}
		if (member.role !== "OWNER" && existing.paidById !== userId) {
			throw ApiError.forbidden("Only the trip owner or expense payer can update this expense");
		}

		const amountMinor = input.amount === undefined ? undefined : toMinorSafely(input.amount, "amount");
		const existingAmountMinor = toMinorSafely(existing.amount.toString(), "amount");
		const amountChanged = amountMinor !== undefined && amountMinor !== existingAmountMinor;
		if (amountChanged && input.split === undefined) {
			throw ApiError.badRequest("split is required when amount changes");
		}
		if (input.paidById !== undefined) {
			await validatePayer(tripId, input.paidById);
		}

		let shares: Share[] | undefined;
		if (input.split) {
			shares = await createShares(tripId, input.split, amountMinor ?? existingAmountMinor);
		}
		const fields: Omit<UpdateExpenseInput, "split" | "amount"> = {
			...(input.title === undefined ? {} : { title: input.title }),
			...(input.category === undefined ? {} : { category: input.category }),
			...(input.paidById === undefined ? {} : { paidById: input.paidById }),
			...(input.expenseDate === undefined ? {} : { expenseDate: input.expenseDate }),
			...(input.note === undefined ? {} : { note: input.note }),
		};
		try {
			const expense = await saveExpense(tripId, expenseId, fields, amountMinor, shares);
			return mapExpense(expense);
		} catch (error) {
			if (isPrismaError(error, "P2025")) {
				throw ApiError.notFound("Expense not found");
			}
			if (isPrismaError(error, "P2003")) {
				throw ApiError.badRequest("Payer and split participants must be registered trip members");
			}
			throw error;
		}
	},

	async deleteExpense(tripId: string, expenseId: string, userId: string): Promise<void> {
		const { member } = await assertWritableTrip(tripId, userId);
		const existing = await findExpenseById(tripId, expenseId);
		if (!existing) {
			throw ApiError.notFound("Expense not found");
		}
		if (member.role !== "OWNER" && existing.paidById !== userId) {
			throw ApiError.forbidden("Only the trip owner or expense payer can delete this expense");
		}
		try {
			await removeExpense(tripId, expenseId);
		} catch (error) {
			if (isPrismaError(error, "P2025")) {
				throw ApiError.notFound("Expense not found");
			}
			throw error;
		}
	},
};
