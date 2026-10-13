import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/ApiResponse";
import { itineraryService } from "./itinerary.service";
import type {
	CreateItineraryItemInput,
	ReorderItineraryInput,
	UpdateItineraryItemInput,
} from "./itinerary.types";

const tripIdFrom = (request: Request): string => request.params.tripId as string;
const userIdFrom = (request: Request): string => request.user!.id;

export const itineraryController = {
	list: asyncHandler(async (request: Request, response: Response) => {
		const itinerary = await itineraryService.listItinerary(tripIdFrom(request), userIdFrom(request));
		sendSuccess(response, {
			message: "Itinerary fetched successfully",
			data: itinerary,
		});
	}),

	create: asyncHandler(async (request: Request, response: Response) => {
		const item = await itineraryService.createItem(
			tripIdFrom(request),
			userIdFrom(request),
			request.body as CreateItineraryItemInput,
		);
		sendSuccess(response, {
			statusCode: 201,
			message: "Itinerary item created successfully",
			data: item,
		});
	}),

	reorder: asyncHandler(async (request: Request, response: Response) => {
		const result = await itineraryService.reorderItems(
			tripIdFrom(request),
			userIdFrom(request),
			request.body as ReorderItineraryInput,
		);
		sendSuccess(response, {
			message: "Itinerary items reordered successfully",
			data: result,
		});
	}),

	update: asyncHandler(async (request: Request, response: Response) => {
		const item = await itineraryService.updateItem(
			tripIdFrom(request),
			request.params.itemId as string,
			userIdFrom(request),
			request.body as UpdateItineraryItemInput,
		);
		sendSuccess(response, {
			message: "Itinerary item updated successfully",
			data: item,
		});
	}),

	remove: asyncHandler(async (request: Request, response: Response) => {
		const itemId = request.params.itemId as string;
		await itineraryService.deleteItem(tripIdFrom(request), itemId, userIdFrom(request));
		sendSuccess(response, {
			message: "Itinerary item deleted successfully",
			data: { id: itemId },
		});
	}),
};
