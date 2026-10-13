import { ApiError } from "../../utils/ApiError";
import { buildMeta, getPagination } from "../../utils/pagination";
import { assertTripAccess } from "../trips/trips.service";
import {
	createExpenseWithSplits,
	createSettlement,
	deleteExpense as removeExpense,
	deleteSettlement as removeSettlement,
	findAcceptedMemberIds,
	findExpenseById,
	findExpenses,
	findSettlementById,
	findTripBalanceRecords,
	findTripSettlements,
	updateExpense as saveExpense,
} from "./expenses.repository";
import {
	computeBalances,
	fromMinor,
	splitEqual,
	suggestTransfers,
	sumMinor,
	toMinor,
	validateExactShares,
} from "./expenses.money";
import type { Share } from "./expenses.money";
import type {
	CreateExpenseInput,
	CreateSettlementInput,
	ListExpensesQuery,
	SettlementListQuery,
	UpdateExpenseInput,
} from "./expenses.types";

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

const mapSettlement = (settlement: NonNullable<Awaited<ReturnType<typeof findSettlementById>>>) => ({
	id: settlement.id,
	from: settlement.fromUser,
	to: settlement.toUser,
	amount: fromMinor(toMinorSafely(settlement.amount.toString(), "settlement amount")),
	note: settlement.note,
	settledAt: settlement.settledAt,
	createdAt: settlement.createdAt,
	updatedAt: settlement.updatedAt,
});

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

	async getBalances(tripId: string, userId: string) {
		await assertTripAccess(tripId, userId);
		const records = await findTripBalanceRecords(tripId);
		const names = new Map<string, string | null>();
		for (const member of records.members) names.set(member.user.id, member.user.name);
		for (const expense of records.expenses) {
			names.set(expense.paidBy.id, expense.paidBy.name);
			for (const split of expense.splits) names.set(split.user.id, split.user.name);
		}
		for (const settlement of records.settlements) {
			names.set(settlement.fromUser.id, settlement.fromUser.name);
			names.set(settlement.toUser.id, settlement.toUser.name);
		}

		const expenses = records.expenses.map((expense) => ({
			paidById: expense.paidById,
			amountMinor: toMinorSafely(expense.amount.toString(), "expense amount"),
		}));
		const splits = records.expenses.flatMap((expense) => expense.splits.map((split) => ({
			userId: split.userId,
			amountMinor: toMinorSafely(split.amount.toString(), "split amount"),
		})));
		const settlements = records.settlements.map((settlement) => ({
			fromUserId: settlement.fromUserId,
			toUserId: settlement.toUserId,
			amountMinor: toMinorSafely(settlement.amount.toString(), "settlement amount"),
		}));
		const memberIds = [...new Set([
			...records.members.map((member) => member.userId),
			...expenses.map((expense) => expense.paidById),
			...splits.map((split) => split.userId),
			...settlements.flatMap((settlement) => [settlement.fromUserId, settlement.toUserId]),
		])];
		const balances = computeBalances(expenses, splits, settlements, memberIds);
		const transfers = suggestTransfers(balances);
		return {
			members: Object.entries(balances)
				.sort(([left], [right]) => left.localeCompare(right))
				.map(([id, balance]) => ({
					user: { id, name: names.get(id) ?? null },
					paid: fromMinor(balance.paid),
					owed: fromMinor(balance.owed),
					settledSent: fromMinor(balance.settledSent),
					settledReceived: fromMinor(balance.settledReceived),
					net: fromMinor(balance.net),
				})),
			suggestedTransfers: transfers.map((transfer) => ({
				from: { id: transfer.fromUserId, name: names.get(transfer.fromUserId) ?? null },
				to: { id: transfer.toUserId, name: names.get(transfer.toUserId) ?? null },
				amount: fromMinor(transfer.amountMinor),
			})),
			totalSpent: fromMinor(sumMinor(expenses.map((expense) => expense.amountMinor))),
		};
	},

	async createSettlement(tripId: string, userId: string, input: CreateSettlementInput) {
		const { trip, member } = await assertTripAccess(tripId, userId);
		if (trip.status === "CANCELLED") {
			throw ApiError.conflict("Settlements cannot be recorded for a cancelled trip");
		}
		if (input.fromUserId === input.toUserId) {
			throw ApiError.badRequest("fromUserId and toUserId must be different");
		}
		await assertAcceptedMembers(tripId, [input.fromUserId, input.toUserId]);
		if (
			member.role !== "OWNER"
			&& userId !== input.fromUserId
			&& userId !== input.toUserId
		) {
			throw ApiError.forbidden("Only the trip owner or a settlement participant can record this settlement");
		}
		const amountMinor = toMinorSafely(input.amount, "amount");
		try {
			const settlement = await createSettlement({
				tripId,
				fromUserId: input.fromUserId,
				toUserId: input.toUserId,
				amountMinor,
				note: input.note,
				settledAt: input.settledAt ?? new Date(),
			});
			return mapSettlement(settlement);
		} catch (error) {
			if (isPrismaError(error, "P2003")) {
				throw ApiError.badRequest("Both settlement participants must be accepted trip members");
			}
			throw error;
		}
	},

	async listSettlements(tripId: string, userId: string, query: SettlementListQuery) {
		await assertTripAccess(tripId, userId);
		const pagination = getPagination({ page: query.page, limit: query.limit });
		const result = await findTripSettlements(tripId, pagination.skip, pagination.limit);
		return {
			settlements: result.settlements.map(mapSettlement),
			meta: buildMeta(result.total, pagination.page, pagination.limit),
		};
	},

	async deleteSettlement(tripId: string, settlementId: string, userId: string): Promise<void> {
		const { trip, member } = await assertTripAccess(tripId, userId);
		const settlement = await findSettlementById(tripId, settlementId);
		if (!settlement) {
			throw ApiError.notFound("Settlement not found");
		}
		if (trip.status === "CANCELLED") {
			throw ApiError.conflict("Settlements cannot be changed for a cancelled trip");
		}
		if (
			member.role !== "OWNER"
			&& userId !== settlement.fromUserId
			&& userId !== settlement.toUserId
		) {
			throw ApiError.forbidden("Only the trip owner or a settlement participant can delete this settlement");
		}
		try {
			await removeSettlement(tripId, settlementId);
		} catch (error) {
			if (isPrismaError(error, "P2025")) {
				throw ApiError.notFound("Settlement not found");
			}
			throw error;
		}
	},
};
