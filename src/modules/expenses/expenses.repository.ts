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

export type ExpenseRecord = Prisma.ExpenseGetPayload<{ include: typeof expenseInclude }>;

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
	data: Omit<CreateExpenseInput, "split" | "amount" | "paidById" | "expenseDate">;
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
	await transaction.expense.update({
		where: { id: expenseId, tripId },
		data: {
			...(input.title === undefined ? {} : { title: input.title }),
			...(amountMinor === undefined ? {} : { amount: fromMinor(amountMinor) }),
			...(input.category === undefined ? {} : { category: input.category }),
			...(input.paidById === undefined ? {} : { paidById: input.paidById }),
			...(input.expenseDate === undefined ? {} : { expenseDate: input.expenseDate }),
			...(input.note === undefined ? {} : { note: input.note }),
		},
	});
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
