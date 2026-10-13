import type { Prisma } from "../../generated/prisma";
import { prisma } from "../../lib/prisma";
import type { CreateDestinationInput, UpdateDestinationInput } from "./destinations.types";

const categoryInclude = {
	category: {
		select: { id: true, name: true, slug: true },
	},
} satisfies Prisma.DestinationInclude;

const detailInclude = {
	...categoryInclude,
	images: { orderBy: { sortOrder: "asc" } },
} satisfies Prisma.DestinationInclude;

export type DestinationListRecord = Prisma.DestinationGetPayload<{ include: typeof categoryInclude }>;
export type DestinationDetailRecord = Prisma.DestinationGetPayload<{ include: typeof detailInclude }>;
export type DestinationRecord = DestinationListRecord | DestinationDetailRecord;

export const findDestinations = async ({
	where,
	orderBy,
	skip,
	take,
}: {
	where: Prisma.DestinationWhereInput;
	orderBy: Prisma.DestinationOrderByWithRelationInput[];
	skip: number;
	take: number;
}) => {
	const [destinations, total] = await Promise.all([
		prisma.destination.findMany({ where, orderBy, skip, take, include: categoryInclude }),
		prisma.destination.count({ where }),
	]);
	return { destinations, total };
};

export const findDestinationBySlug = async (slug: string, publishedOnly: boolean) =>
	prisma.destination.findFirst({
		where: {
			slug,
			...(publishedOnly ? { status: "PUBLISHED" } : {}),
		},
		include: detailInclude,
	});

export const findDestinationById = async (id: string) => prisma.destination.findUnique({
	where: { id },
	include: detailInclude,
});

export const findDestinationBySlugValue = async (slug: string, excludeId?: string) =>
	prisma.destination.findFirst({
		where: {
			slug,
			...(excludeId ? { id: { not: excludeId } } : {}),
		},
		select: { id: true },
	});

export const categoryExists = async (categoryId: string): Promise<boolean> =>
	(await prisma.category.findUnique({ where: { id: categoryId }, select: { id: true } })) !== null;

export const createDestinationWithImages = async (
	data: Prisma.DestinationUncheckedCreateInput,
	input: CreateDestinationInput,
): Promise<DestinationDetailRecord> => prisma.$transaction(async (transaction) => {
	const created = await transaction.destination.create({
		data,
		select: { id: true },
	});
	if (input.images?.length) {
		await transaction.destinationImage.createMany({
			data: input.images.map((image) => ({
				destinationId: created.id,
				url: image.url,
				...(image.caption === undefined ? {} : { caption: image.caption }),
				...(image.sortOrder === undefined ? {} : { sortOrder: image.sortOrder }),
			})),
		});
	}
	return transaction.destination.findUniqueOrThrow({ where: { id: created.id }, include: detailInclude });
});

export const updateDestinationWithImages = async (
	id: string,
	data: Prisma.DestinationUncheckedUpdateInput,
	images?: UpdateDestinationInput["images"],
): Promise<DestinationDetailRecord> => prisma.$transaction(async (transaction) => {
	await transaction.destination.update({ where: { id }, data });
	if (images !== undefined) {
		await transaction.destinationImage.deleteMany({ where: { destinationId: id } });
		if (images.length) {
			await transaction.destinationImage.createMany({
				data: images.map((image) => ({
					destinationId: id,
					url: image.url,
					...(image.caption === undefined ? {} : { caption: image.caption }),
					...(image.sortOrder === undefined ? {} : { sortOrder: image.sortOrder }),
				})),
			});
		}
	}
	return transaction.destination.findUniqueOrThrow({ where: { id }, include: detailInclude });
});

export const updateDestination = async (
	id: string,
	data: Prisma.DestinationUncheckedUpdateInput,
): Promise<DestinationDetailRecord> => prisma.destination.update({
	where: { id },
	data,
	include: detailInclude,
});

export const deleteDestination = async (id: string): Promise<void> => {
	await prisma.destination.delete({ where: { id } });
};
