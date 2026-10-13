import type { Prisma } from "../../generated/prisma";
import { prisma } from "../../lib/prisma";
import type { CreatePackingItemInput, UpdatePackingItemInput } from "./packing.types";

const packingItemInclude = {
	gearItem: { select: { id: true, name: true } },
	assignedTo: { select: { id: true, name: true } },
	addedBy: { select: { id: true, name: true } },
} satisfies Prisma.PackingItemInclude;

export type PackingItemRecord = Prisma.PackingItemGetPayload<{ include: typeof packingItemInclude }>;

export const findPackingItems = async ({
	tripId,
	category,
	isPacked,
	assignedToId,
	skip,
	take,
}: {
	tripId: string;
	category?: string;
	isPacked?: boolean;
	assignedToId?: string;
	skip: number;
	take: number;
}) => {
	const where: Prisma.PackingItemWhereInput = {
		tripId,
		...(category === undefined ? {} : { category }),
		...(isPacked === undefined ? {} : { isPacked }),
		...(assignedToId === undefined ? {} : { assignedToId }),
	};
	const [items, total, summaryTotal, packed] = await Promise.all([
		prisma.packingItem.findMany({
			where,
			include: packingItemInclude,
			orderBy: [{ createdAt: "asc" }, { id: "asc" }],
			skip,
			take,
		}),
		prisma.packingItem.count({ where }),
		prisma.packingItem.count({ where: { tripId } }),
		prisma.packingItem.count({ where: { tripId, isPacked: true } }),
	]);
	return { items, total, summaryTotal, packed };
};

export const findGearItem = async (gearItemId: string) => prisma.gearItem.findUnique({
	where: { id: gearItemId },
	select: { id: true },
});

export const isAcceptedTripMember = async (tripId: string, userId: string): Promise<boolean> =>
	(await prisma.tripMember.findFirst({
		where: { tripId, userId, status: "ACCEPTED" },
		select: { id: true },
	})) !== null;

export const createPackingItem = async (tripId: string, addedById: string, input: CreatePackingItemInput) =>
	prisma.packingItem.create({
		data: {
			tripId,
			addedById,
			name: input.name,
			category: input.category,
			quantity: input.quantity,
			gearItemId: input.gearItemId,
			assignedToId: input.assignedToId,
		},
		include: packingItemInclude,
	});

export const createPackingItems = async (
	tripId: string,
	addedById: string,
	items: CreatePackingItemInput[],
): Promise<PackingItemRecord[]> => prisma.$transaction(async (transaction) => {
	const created: PackingItemRecord[] = [];
	for (const item of items) {
		created.push(await transaction.packingItem.create({
			data: {
				tripId,
				addedById,
				name: item.name,
				category: item.category,
				quantity: item.quantity,
				gearItemId: item.gearItemId,
				assignedToId: item.assignedToId,
			},
			include: packingItemInclude,
		}));
	}
	return created;
});

export const findPackingItem = async (tripId: string, itemId: string) => prisma.packingItem.findFirst({
	where: { tripId, id: itemId },
	include: packingItemInclude,
});

export const updatePackingItem = async (itemId: string, data: UpdatePackingItemInput) => prisma.packingItem.update({
	where: { id: itemId },
	data,
	include: packingItemInclude,
});

export const deletePackingItem = async (itemId: string): Promise<void> => {
	await prisma.packingItem.delete({ where: { id: itemId } });
};
