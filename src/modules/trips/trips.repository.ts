import type { Prisma } from "../../generated/prisma";
import { prisma } from "../../lib/prisma";
import type { CreateTripInput } from "./trips.types";

const destinationSummary = {
	id: true,
	name: true,
	slug: true,
	coverImage: true,
} satisfies Prisma.DestinationSelect;

const tripListInclude = {
	destination: { select: destinationSummary },
	members: {
		where: { status: "ACCEPTED" },
		select: { userId: true, role: true },
	},
} satisfies Prisma.TripInclude;

const tripDetailsInclude = {
	owner: { select: { id: true, name: true } },
	destination: { select: destinationSummary },
	members: {
		where: { status: "ACCEPTED" },
		include: { user: { select: { id: true, name: true, image: true } } },
		orderBy: { createdAt: "asc" },
	},
} satisfies Prisma.TripInclude;

export const findPublishedDestination = async (destinationId: string) => prisma.destination.findFirst({
	where: { id: destinationId, status: "PUBLISHED" },
	select: { id: true },
});

export const createTripWithOwner = async (input: CreateTripInput, ownerId: string): Promise<{ id: string }> =>
	prisma.$transaction(async (transaction) => {
		const trip = await transaction.trip.create({
			data: {
				title: input.title,
				destinationId: input.destinationId,
				startDate: input.startDate,
				endDate: input.endDate,
				budget: input.budget,
				notes: input.notes,
				status: "PLANNING",
				ownerId,
			},
			select: { id: true },
		});
		await transaction.tripMember.create({
			data: {
				tripId: trip.id,
				userId: ownerId,
				role: "OWNER",
				status: "ACCEPTED",
			},
		});
		return trip;
	});

export const findAcceptedTripMember = async (tripId: string, userId: string) => prisma.tripMember.findFirst({
	where: { tripId, userId, status: "ACCEPTED" },
	include: { trip: { include: tripDetailsInclude } },
});

export const findTripsForMember = async ({
	userId,
	status,
	orderBy,
	skip,
	take,
}: {
	userId: string;
	status?: Prisma.TripWhereInput["status"];
	orderBy: Prisma.TripOrderByWithRelationInput[];
	skip: number;
	take: number;
}) => {
	const where: Prisma.TripWhereInput = {
		...(status ? { status } : {}),
		members: { some: { userId, status: "ACCEPTED" } },
	};
	const [trips, total] = await Promise.all([
		prisma.trip.findMany({ where, include: tripListInclude, orderBy, skip, take }),
		prisma.trip.count({ where }),
	]);
	return { trips, total };
};

export const findPendingInvitations = async (userId: string, skip: number, take: number) => {
	const where: Prisma.TripMemberWhereInput = { userId, status: "PENDING" };
	const [invitations, total] = await Promise.all([
		prisma.tripMember.findMany({
			where,
			include: {
				trip: {
					include: {
						destination: { select: { name: true } },
						owner: { select: { name: true } },
					},
				},
			},
			orderBy: { createdAt: "desc" },
			skip,
			take,
		}),
		prisma.tripMember.count({ where }),
	]);
	return { invitations, total };
};

export const findUserByEmail = async (email: string) => prisma.user.findUnique({
	where: { email },
	select: { id: true, name: true },
});

export const findTripMember = async (tripId: string, userId: string) => prisma.tripMember.findUnique({
	where: { tripId_userId: { tripId, userId } },
	select: { id: true, role: true, status: true },
});

export const createPendingMember = async (tripId: string, userId: string) => prisma.tripMember.create({
	data: { tripId, userId, role: "MEMBER", status: "PENDING" },
	select: { user: { select: { id: true, name: true } } },
});

export const findPendingInvitation = async (tripId: string, userId: string) => prisma.tripMember.findFirst({
	where: { tripId, userId, status: "PENDING" },
	include: { trip: { select: { id: true } } },
});

export const acceptInvitation = async (tripId: string, userId: string) => prisma.tripMember.update({
	where: { tripId_userId: { tripId, userId } },
	data: { status: "ACCEPTED" },
});

export const declineInvitation = async (tripId: string, userId: string): Promise<void> => {
	await prisma.tripMember.delete({ where: { tripId_userId: { tripId, userId } } });
};

export const findTripMembers = async ({
	tripId,
	includePending,
	skip,
	take,
}: {
	tripId: string;
	includePending: boolean;
	skip: number;
	take: number;
}) => {
	const where: Prisma.TripMemberWhereInput = {
		tripId,
		...(includePending ? { status: { in: ["ACCEPTED", "PENDING"] } } : { status: "ACCEPTED" }),
	};
	const [members, total] = await Promise.all([
		prisma.tripMember.findMany({
			where,
			include: { user: { select: { id: true, name: true, image: true, email: true } } },
			orderBy: { createdAt: "asc" },
			skip,
			take,
		}),
		prisma.tripMember.count({ where }),
	]);
	return { members, total };
};

export const findTripById = async (tripId: string) => prisma.trip.findUnique({
	where: { id: tripId },
	select: { id: true, status: true },
});

export const updateTrip = async (tripId: string, data: Prisma.TripUncheckedUpdateInput) => prisma.trip.update({
	where: { id: tripId },
	data,
	select: { id: true },
});

export const hasItineraryAfterDay = async (tripId: string, dayNumber: number): Promise<boolean> =>
	(await prisma.itineraryItem.count({ where: { tripId, dayNumber: { gt: dayNumber } } })) > 0;

export const deleteTrip = async (tripId: string): Promise<void> => {
	await prisma.trip.delete({ where: { id: tripId } });
};

export const countTripExpensesAndSettlements = async (tripId: string): Promise<number> => {
	const [expenses, settlements] = await Promise.all([
		prisma.expense.count({ where: { tripId } }),
		prisma.settlement.count({ where: { tripId } }),
	]);
	return expenses + settlements;
};

export const countMemberFinancialReferences = async (tripId: string, userId: string): Promise<number> => {
	const [paidExpenses, expenseSplits, settlements] = await Promise.all([
		prisma.expense.count({ where: { tripId, paidById: userId } }),
		prisma.expenseSplit.count({ where: { userId, expense: { tripId } } }),
		prisma.settlement.count({
			where: {
				tripId,
				OR: [{ fromUserId: userId }, { toUserId: userId }],
			},
		}),
	]);
	return paidExpenses + expenseSplits + settlements;
};

export const deleteTripMember = async (tripId: string, userId: string): Promise<void> => {
	await prisma.$transaction(async (transaction) => {
		await transaction.packingItem.updateMany({
			where: { tripId, assignedToId: userId },
			data: { assignedToId: null },
		});
		await transaction.tripMember.delete({ where: { tripId_userId: { tripId, userId } } });
	});
};
