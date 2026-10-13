import type { Prisma } from "../../generated/prisma";
import { prisma } from "../../lib/prisma";
import type { CreateReviewInput, UpdateReviewInput } from "./reviews.types";

const publicReviewInclude = {
	user: { select: { id: true, name: true, image: true } },
} satisfies Prisma.ReviewInclude;

const adminReviewInclude = {
	user: { select: { id: true, name: true, image: true } },
	destination: { select: { id: true, name: true, slug: true } },
} satisfies Prisma.ReviewInclude;

export const findPublishedDestination = async (slug: string) => prisma.destination.findFirst({
	where: { slug, status: "PUBLISHED" },
	select: { id: true, name: true, slug: true, avgRating: true, reviewCount: true },
});

export const userCanReviewDestination = async (userId: string, destinationId: string): Promise<boolean> =>
	(await prisma.tripMember.findFirst({
		where: {
			userId,
			status: "ACCEPTED",
			trip: { is: { destinationId, status: "COMPLETED" } },
		},
		select: { id: true },
	})) !== null;

export const findUserReview = async (destinationId: string, userId: string) => prisma.review.findUnique({
	where: { destinationId_userId: { destinationId, userId } },
	include: publicReviewInclude,
});

const recomputeDestinationRatings = async (
	transaction: Prisma.TransactionClient,
	destinationId: string,
): Promise<void> => {
	const aggregate = await transaction.review.aggregate({
		where: { destinationId, isHidden: false },
		_avg: { rating: true },
		_count: { _all: true },
	});
	const avgRating = Math.round((aggregate._avg.rating ?? 0) * 10) / 10;
	await transaction.destination.update({
		where: { id: destinationId },
		data: { avgRating, reviewCount: aggregate._count._all },
	});
};

export const createReview = async (destinationId: string, userId: string, input: CreateReviewInput) =>
	prisma.$transaction(async (transaction) => {
		const review = await transaction.review.create({
			data: {
				destinationId,
				userId,
				rating: input.rating,
				comment: input.comment,
			},
			include: publicReviewInclude,
		});
		await recomputeDestinationRatings(transaction, destinationId);
		return review;
	});

export const findPublicReviews = async (destinationId: string, skip: number, take: number) => {
	const where: Prisma.ReviewWhereInput = { destinationId, isHidden: false };
	const [reviews, total, distribution] = await Promise.all([
		prisma.review.findMany({
			where,
			include: publicReviewInclude,
			orderBy: [{ createdAt: "desc" }, { id: "desc" }],
			skip,
			take,
		}),
		prisma.review.count({ where }),
		prisma.review.groupBy({
			by: ["rating"],
			where,
			_count: { _all: true },
		}),
	]);
	return { reviews, total, distribution };
};

export const updateUserReview = async (
	destinationId: string,
	userId: string,
	input: UpdateReviewInput,
) => prisma.$transaction(async (transaction) => {
	const review = await transaction.review.update({
		where: { destinationId_userId: { destinationId, userId } },
		data: input,
		include: publicReviewInclude,
	});
	await recomputeDestinationRatings(transaction, destinationId);
	return review;
});

export const deleteUserReview = async (destinationId: string, userId: string): Promise<void> => {
	await prisma.$transaction(async (transaction) => {
		await transaction.review.delete({ where: { destinationId_userId: { destinationId, userId } } });
		await recomputeDestinationRatings(transaction, destinationId);
	});
};

export const findAdminReviews = async ({
	isHidden,
	destinationId,
	rating,
	skip,
	take,
}: {
	isHidden?: boolean;
	destinationId?: string;
	rating?: number;
	skip: number;
	take: number;
}) => {
	const where: Prisma.ReviewWhereInput = {
		...(isHidden === undefined ? {} : { isHidden }),
		...(destinationId === undefined ? {} : { destinationId }),
		...(rating === undefined ? {} : { rating }),
	};
	const [reviews, total] = await Promise.all([
		prisma.review.findMany({
			where,
			include: adminReviewInclude,
			orderBy: [{ createdAt: "desc" }, { id: "desc" }],
			skip,
			take,
		}),
		prisma.review.count({ where }),
	]);
	return { reviews, total };
};

export const findReviewById = async (id: string) => prisma.review.findUnique({
	where: { id },
	include: adminReviewInclude,
});

export const updateReviewVisibility = async (id: string, isHidden: boolean) =>
	prisma.$transaction(async (transaction) => {
		const review = await transaction.review.update({
			where: { id },
			data: { isHidden },
			include: adminReviewInclude,
		});
		await recomputeDestinationRatings(transaction, review.destinationId);
		return review;
	});

export const deleteReview = async (id: string): Promise<void> => {
	await prisma.$transaction(async (transaction) => {
		const review = await transaction.review.delete({ where: { id }, select: { destinationId: true } });
		await recomputeDestinationRatings(transaction, review.destinationId);
	});
};
