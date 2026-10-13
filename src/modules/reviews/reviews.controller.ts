import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/ApiResponse";
import { reviewsService } from "./reviews.service";
import type {
	AdminReviewsQuery,
	CreateReviewInput,
	PublicReviewsQuery,
	UpdateReviewInput,
	UpdateReviewVisibilityInput,
} from "./reviews.types";

const slugFrom = (request: Request): string => request.params.slug as string;
const userIdFrom = (request: Request): string => request.user!.id;

export const reviewsController = {
	listPublic: asyncHandler(async (request: Request, response: Response) => {
		const result = await reviewsService.listPublicReviews(
			slugFrom(request),
			request.query as unknown as PublicReviewsQuery,
		);
		sendSuccess(response, {
			message: "Reviews fetched successfully",
			data: { items: result.reviews, summary: result.summary },
			meta: result.meta,
		});
	}),

	getMine: asyncHandler(async (request: Request, response: Response) => {
		const result = await reviewsService.getMyReview(slugFrom(request), userIdFrom(request));
		sendSuccess(response, {
			message: "Review eligibility fetched successfully",
			data: result,
		});
	}),

	create: asyncHandler(async (request: Request, response: Response) => {
		const review = await reviewsService.createReview(
			slugFrom(request),
			userIdFrom(request),
			request.body as CreateReviewInput,
		);
		sendSuccess(response, {
			statusCode: 201,
			message: "Review created successfully",
			data: review,
		});
	}),

	updateMine: asyncHandler(async (request: Request, response: Response) => {
		const review = await reviewsService.updateMyReview(
			slugFrom(request),
			userIdFrom(request),
			request.body as UpdateReviewInput,
		);
		sendSuccess(response, {
			message: "Review updated successfully",
			data: review,
		});
	}),

	deleteMine: asyncHandler(async (request: Request, response: Response) => {
		await reviewsService.deleteMyReview(slugFrom(request), userIdFrom(request));
		sendSuccess(response, {
			message: "Review deleted successfully",
			data: null,
		});
	}),

	listAdmin: asyncHandler(async (request: Request, response: Response) => {
		const result = await reviewsService.listAdminReviews(request.query as unknown as AdminReviewsQuery);
		sendSuccess(response, {
			message: "Reviews fetched successfully",
			data: result.reviews,
			meta: result.meta,
		});
	}),

	setVisibility: asyncHandler(async (request: Request, response: Response) => {
		const review = await reviewsService.setReviewVisibility(
			request.params.id as string,
			request.body as UpdateReviewVisibilityInput,
		);
		sendSuccess(response, {
			message: "Review visibility updated successfully",
			data: review,
		});
	}),

	deleteAdmin: asyncHandler(async (request: Request, response: Response) => {
		const id = request.params.id as string;
		await reviewsService.deleteAdminReview(id);
		sendSuccess(response, {
			message: "Review deleted successfully",
			data: { id },
		});
	}),
};
