import type { Prisma } from "../../generated/prisma";
import { prisma } from "../../lib/prisma";
import type { CreateItineraryItemInput, UpdateItineraryItemInput } from "./itinerary.types";

export const findItineraryItems = async (tripId: string) => prisma.itineraryItem.findMany({
	where: { tripId },
	orderBy: [{ dayNumber: "asc" }, { sortOrder: "asc" }, { startTime: "asc" }],
});

export const findMaximumSortOrder = async (tripId: string, dayNumber: number): Promise<number | null> => {
	const result = await prisma.itineraryItem.aggregate({
		where: { tripId, dayNumber },
		_max: { sortOrder: true },
	});
	return result._max.sortOrder;
};

export const createItineraryItem = async (
	tripId: string,
	input: CreateItineraryItemInput & { sortOrder: number },
) => prisma.itineraryItem.create({
	data: { tripId, ...input },
});

export const findItineraryItem = async (tripId: string, itemId: string) => prisma.itineraryItem.findFirst({
	where: { id: itemId, tripId },
});

export const findItineraryItemsByIds = async (tripId: string, dayNumber: number, itemIds: string[]) =>
	prisma.itineraryItem.findMany({
		where: { id: { in: itemIds }, tripId, dayNumber },
		select: { id: true },
	});

export const updateItineraryItem = async (itemId: string, data: UpdateItineraryItemInput) =>
	prisma.itineraryItem.update({ where: { id: itemId }, data });

export const reorderItineraryItems = async (itemIds: string[]): Promise<void> => {
	if (itemIds.length === 0) {
		return;
	}
	const updates = itemIds.map((id, sortOrder) =>
		prisma.itineraryItem.update({ where: { id }, data: { sortOrder } }));
	await prisma.$transaction(updates);
};

export const deleteItineraryItem = async (itemId: string): Promise<void> => {
	await prisma.itineraryItem.delete({ where: { id: itemId } });
};

export const hasItineraryDayAfter = async (tripId: string, dayNumber: number): Promise<boolean> => {
	const item: Prisma.ItineraryItemWhereInput = { tripId, dayNumber: { gt: dayNumber } };
	return (await prisma.itineraryItem.count({ where: item })) > 0;
};
