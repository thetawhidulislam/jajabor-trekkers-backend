import { ApiError } from "../../utils/ApiError";
import { buildMeta, getPagination } from "../../utils/pagination";
import {
	createReview,
	deleteReview as removeAdminReview,
	deleteUserReview,
	findAdminReviews,
	findPublishedDestination,
	findReviewById,
	findPublicReviews,
	findUserReview,
	updateReviewVisibility,
	updateUserReview,
	userCanReviewDestination,
} from "./reviews.repository";
import type {
	AdminReviewsQuery,
	CreateReviewInput,
	PublicReviewsQuery,
	UpdateReviewInput,
	UpdateReviewVisibilityInput,
} from "./reviews.types";

type PublicReviewRecord = NonNullable<Awaited<ReturnType<typeof findUserReview>>>;

const mapPublicReview = (review: PublicReviewRecord) => ({
	id: review.id,
	rating: review.rating,
	comment: review.comment,
	createdAt: review.createdAt,
	user: review.user,
});

const mapAdminReview = (review: NonNullable<Awaited<ReturnType<typeof findReviewById>>>) => ({
	id: review.id,
	rating: review.rating,
	comment: review.comment,
	isHidden: review.isHidden,
	createdAt: review.createdAt,
	updatedAt: review.updatedAt,
	user: review.user,
	destination: review.destination,
});

const getPublishedDestination = async (slug: string) => {
	const destination = await findPublishedDestination(slug);
	if (!destination) {
		throw ApiError.notFound("Destination not found");
	}
	return destination;
};

const assertReviewEligibility = async (userId: string, destinationId: string): Promise<void> => {
	if (!await userCanReviewDestination(userId, destinationId)) {
		throw ApiError.forbidden("You can review a destination after completing a trip to it");
	}
};

export const reviewsService = {
	async listPublicReviews(slug: string, query: PublicReviewsQuery) {
		const destination = await getPublishedDestination(slug);
		const pagination = getPagination({ page: query.page, limit: query.limit });
		const result = await findPublicReviews(destination.id, pagination.skip, pagination.limit);
		const distribution: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
		for (const entry of result.distribution) {
			distribution[entry.rating as 1 | 2 | 3 | 4 | 5] = entry._count._all;
		}
		return {
			reviews: result.reviews.map(mapPublicReview),
			meta: buildMeta(result.total, pagination.page, pagination.limit),
			summary: {
				avgRating: destination.avgRating,
				reviewCount: destination.reviewCount,
				distribution,
			},
		};
	},

	async getMyReview(slug: string, userId: string) {
		const destination = await getPublishedDestination(slug);
		const [review, eligible] = await Promise.all([
			findUserReview(destination.id, userId),
			userCanReviewDestination(userId, destination.id),
		]);
		return {
			review: review ? mapPublicReview(review) : null,
			canReview: eligible && review === null,
		};
	},

	async createReview(slug: string, userId: string, input: CreateReviewInput) {
		const destination = await getPublishedDestination(slug);
		if (await findUserReview(destination.id, userId)) {
			throw ApiError.conflict("You have already reviewed this destination");
		}
		await assertReviewEligibility(userId, destination.id);
		try {
			const review = await createReview(destination.id, userId, input);
			return mapPublicReview(review);
		} catch (error) {
			if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
				throw ApiError.conflict("You have already reviewed this destination");
			}
			throw error;
		}
	},

	async updateMyReview(slug: string, userId: string, input: UpdateReviewInput) {
		const destination = await getPublishedDestination(slug);
		const existing = await findUserReview(destination.id, userId);
		if (!existing) {
			throw ApiError.notFound("Review not found");
		}
		await assertReviewEligibility(userId, destination.id);
		try {
			const review = await updateUserReview(destination.id, userId, input);
			return mapPublicReview(review);
		} catch (error) {
			if (typeof error === "object" && error !== null && "code" in error && error.code === "P2025") {
				throw ApiError.notFound("Review not found");
			}
			throw error;
		}
	},

	async deleteMyReview(slug: string, userId: string): Promise<void> {
		const destination = await getPublishedDestination(slug);
		if (!await findUserReview(destination.id, userId)) {
			throw ApiError.notFound("Review not found");
		}
		try {
			await deleteUserReview(destination.id, userId);
		} catch (error) {
			if (typeof error === "object" && error !== null && "code" in error && error.code === "P2025") {
				throw ApiError.notFound("Review not found");
			}
			throw error;
		}
	},

	async listAdminReviews(query: AdminReviewsQuery) {
		const pagination = getPagination({ page: query.page, limit: query.limit });
		const result = await findAdminReviews({
			isHidden: query.isHidden,
			destinationId: query.destinationId,
			rating: query.rating,
			skip: pagination.skip,
			take: pagination.limit,
		});
		return {
			reviews: result.reviews.map(mapAdminReview),
			meta: buildMeta(result.total, pagination.page, pagination.limit),
		};
	},

	async setReviewVisibility(id: string, input: UpdateReviewVisibilityInput) {
		if (!await findReviewById(id)) {
			throw ApiError.notFound("Review not found");
		}
		try {
			return mapAdminReview(await updateReviewVisibility(id, input.isHidden));
		} catch (error) {
			if (typeof error === "object" && error !== null && "code" in error && error.code === "P2025") {
				throw ApiError.notFound("Review not found");
			}
			throw error;
		}
	},

	async deleteAdminReview(id: string): Promise<void> {
		if (!await findReviewById(id)) {
			throw ApiError.notFound("Review not found");
		}
		try {
			await removeAdminReview(id);
		} catch (error) {
			if (typeof error === "object" && error !== null && "code" in error && error.code === "P2025") {
				throw ApiError.notFound("Review not found");
			}
			throw error;
		}
	},
};
