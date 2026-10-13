import type { Prisma } from "../../generated/prisma";
import { prisma } from "../../lib/prisma";
import { fromMinor } from "./expenses.money";
import type { CreateExpenseInput, UpdateExpenseInput } from "./expenses.types";

const expenseInclude = {
	paidBy: { select: { id: true, name: true } },
	splits: {
		include: { user: { select: { id: true, name: true } } },
		orderBy: { userId: "asc" },
	},
} satisfies Prisma.ExpenseInclude;

const settlementInclude = {
	fromUser: { select: { id: true, name: true } },
	toUser: { select: { id: true, name: true } },
} satisfies Prisma.SettlementInclude;

export type ExpenseRecord = Prisma.ExpenseGetPayload<{ include: typeof expenseInclude }>;
export type SettlementRecord = Prisma.SettlementGetPayload<{ include: typeof settlementInclude }>;

export const findAcceptedMemberIds = async (tripId: string, userIds: string[]): Promise<string[]> => {
	if (userIds.length === 0) {
		return [];
	}
	const members = await prisma.tripMember.findMany({
		where: { tripId, userId: { in: userIds }, status: "ACCEPTED" },
		select: { userId: true },
	});
	return members.map((member) => member.userId);
};

export const createExpenseWithSplits = async ({
	tripId,
	title,
	amountMinor,
	category,
	paidById,
	expenseDate,
	note,
	shares,
}: {
	tripId: string;
	title: string;
	amountMinor: number;
	category: CreateExpenseInput["category"];
	paidById: string;
	expenseDate: Date;
	note?: string;
	shares: Array<{ userId: string; amountMinor: number }>;
}) => prisma.$transaction(async (transaction) => transaction.expense.create({
	data: {
		tripId,
		title,
		amount: fromMinor(amountMinor),
		category,
		paidById,
		expenseDate,
		note,
		splits: {
			create: shares.map((share) => ({
				userId: share.userId,
				amount: fromMinor(share.amountMinor),
			})),
		},
	},
	include: expenseInclude,
}));

export const findExpenses = async ({
	tripId,
	category,
	paidById,
	skip,
	take,
}: {
	tripId: string;
	category?: CreateExpenseInput["category"];
	paidById?: string;
	skip: number;
	take: number;
}) => {
	const where: Prisma.ExpenseWhereInput = {
		tripId,
		...(category ? { category } : {}),
		...(paidById ? { paidById } : {}),
	};
	const [expenses, total, summary] = await Promise.all([
		prisma.expense.findMany({
			where,
			include: expenseInclude,
			orderBy: [{ expenseDate: "desc" }, { createdAt: "desc" }],
			skip,
			take,
		}),
		prisma.expense.count({ where }),
		prisma.expense.aggregate({
			where: { tripId },
			_count: { _all: true },
			_sum: { amount: true },
		}),
	]);
	return {
		expenses,
		total,
		summaryCount: summary._count._all,
		summaryAmount: summary._sum.amount,
	};
};

export const findExpenseById = async (tripId: string, expenseId: string) => prisma.expense.findFirst({
	where: { tripId, id: expenseId },
	include: expenseInclude,
});

export const updateExpense = async (
	tripId: string,
	expenseId: string,
	input: Omit<UpdateExpenseInput, "split">,
	amountMinor: number | undefined,
	shares?: Array<{ userId: string; amountMinor: number }>,
): Promise<ExpenseRecord> => prisma.$transaction(async (transaction) => {
	const updateData: Prisma.ExpenseUpdateInput = {
		...(input.title === undefined ? {} : { title: input.title }),
		...(amountMinor === undefined ? {} : { amount: fromMinor(amountMinor) }),
		...(input.category === undefined ? {} : { category: input.category }),
		...(input.paidById === undefined ? {} : { paidById: input.paidById }),
		...(input.expenseDate === undefined ? {} : { expenseDate: input.expenseDate }),
		...(input.note === undefined ? {} : { note: input.note }),
	};
	if (Object.keys(updateData).length > 0) {
		await transaction.expense.update({ where: { id: expenseId, tripId }, data: updateData });
	}
	if (shares !== undefined) {
		await transaction.expenseSplit.deleteMany({ where: { expenseId } });
		await transaction.expenseSplit.createMany({
			data: shares.map((share) => ({
				expenseId,
				userId: share.userId,
				amount: fromMinor(share.amountMinor),
			})),
		});
	}
	return transaction.expense.findFirstOrThrow({ where: { id: expenseId, tripId }, include: expenseInclude });
});

export const deleteExpense = async (tripId: string, expenseId: string): Promise<void> => {
	await prisma.expense.delete({ where: { id: expenseId, tripId } });
};

export const findTripBalanceRecords = async (tripId: string) => {
	const [members, expenses, settlements] = await Promise.all([
		prisma.tripMember.findMany({
			where: { tripId, status: "ACCEPTED" },
			include: { user: { select: { id: true, name: true } } },
			orderBy: { userId: "asc" },
		}),
		prisma.expense.findMany({
			where: { tripId },
			include: {
				paidBy: { select: { id: true, name: true } },
				splits: {
					include: { user: { select: { id: true, name: true } } },
					orderBy: { userId: "asc" },
				},
			},
		}),
		prisma.settlement.findMany({
			where: { tripId },
			include: settlementInclude,
		}),
	]);
	return { members, expenses, settlements };
};

export const findTripSettlements = async (tripId: string, skip: number, take: number) => {
	const where: Prisma.SettlementWhereInput = { tripId };
	const [settlements, total] = await Promise.all([
		prisma.settlement.findMany({
			where,
			include: settlementInclude,
			orderBy: [{ settledAt: "desc" }, { createdAt: "desc" }],
			skip,
			take,
		}),
		prisma.settlement.count({ where }),
	]);
	return { settlements, total };
};

export const createSettlement = async ({
	tripId,
	fromUserId,
	toUserId,
	amountMinor,
	note,
	settledAt,
}: {
	tripId: string;
	fromUserId: string;
	toUserId: string;
	amountMinor: number;
	note?: string;
	settledAt: Date;
}): Promise<SettlementRecord> => prisma.settlement.create({
	data: {
		tripId,
		fromUserId,
		toUserId,
		amount: fromMinor(amountMinor),
		note,
		settledAt,
	},
	include: settlementInclude,
});

export const findSettlementById = async (tripId: string, settlementId: string) => prisma.settlement.findFirst({
	where: { tripId, id: settlementId },
	include: settlementInclude,
});

export const deleteSettlement = async (tripId: string, settlementId: string): Promise<void> => {
	await prisma.settlement.delete({ where: { id: settlementId, tripId } });
};
