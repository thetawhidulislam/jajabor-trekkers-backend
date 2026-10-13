import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/ApiResponse";
import { destinationsService } from "./destinations.service";
import type {
	AdminDestinationListQuery,
	CreateDestinationInput,
	DestinationListQuery,
	UpdateDestinationFeaturedInput,
	UpdateDestinationInput,
	UpdateDestinationStatusInput,
} from "./destinations.types";

export const destinationsController = {
	listPublic: asyncHandler(async (request: Request, response: Response) => {
		const result = await destinationsService.listPublicDestinations(
			request.query as unknown as DestinationListQuery,
		);
		sendSuccess(response, {
			message: "Destinations fetched successfully",
			data: result.destinations,
			meta: result.meta,
		});
	}),

	getPublic: asyncHandler(async (request: Request, response: Response) => {
		const destination = await destinationsService.getPublicDestination(request.params.slug as string);
		sendSuccess(response, {
			message: "Destination fetched successfully",
			data: destination,
		});
	}),

	listAdmin: asyncHandler(async (request: Request, response: Response) => {
		const result = await destinationsService.listAdminDestinations(
			request.query as unknown as AdminDestinationListQuery,
		);
		sendSuccess(response, {
			message: "Destinations fetched successfully",
			data: result.destinations,
			meta: result.meta,
		});
	}),

	getAdmin: asyncHandler(async (request: Request, response: Response) => {
		const destination = await destinationsService.getAdminDestination(request.params.id as string);
		sendSuccess(response, {
			message: "Destination fetched successfully",
			data: destination,
		});
	}),

	create: asyncHandler(async (request: Request, response: Response) => {
		const destination = await destinationsService.createDestination(
			request.body as CreateDestinationInput,
			request.user!.id,
		);
		sendSuccess(response, {
			statusCode: 201,
			message: "Destination created successfully",
			data: destination,
		});
	}),

	update: asyncHandler(async (request: Request, response: Response) => {
		const destination = await destinationsService.updateAdminDestination(
			request.params.id as string,
			request.body as UpdateDestinationInput,
		);
		sendSuccess(response, {
			message: "Destination updated successfully",
			data: destination,
		});
	}),

	updateStatus: asyncHandler(async (request: Request, response: Response) => {
		const destination = await destinationsService.updateAdminDestinationStatus(
			request.params.id as string,
			request.body as UpdateDestinationStatusInput,
		);
		sendSuccess(response, {
			message: "Destination status updated successfully",
			data: destination,
		});
	}),

	updateFeatured: asyncHandler(async (request: Request, response: Response) => {
		const destination = await destinationsService.updateAdminDestinationFeatured(
			request.params.id as string,
			request.body as UpdateDestinationFeaturedInput,
		);
		sendSuccess(response, {
			message: "Destination featured status updated successfully",
			data: destination,
		});
	}),

	remove: asyncHandler(async (request: Request, response: Response) => {
		await destinationsService.deleteAdminDestination(request.params.id as string);
		sendSuccess(response, {
			message: "Destination deleted successfully",
			data: { id: request.params.id },
		});
	}),
};
