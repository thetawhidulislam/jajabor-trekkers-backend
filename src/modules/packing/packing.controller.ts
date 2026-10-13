import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/ApiResponse";
import { packingService } from "./packing.service";
import type {
	CreatePackingItemInput,
	CreatePackingItemsBulkInput,
	PackingListQuery,
	UpdatePackingItemInput,
} from "./packing.types";

const tripIdFrom = (request: Request): string => request.params.tripId as string;
const itemIdFrom = (request: Request): string => request.params.itemId as string;
const userIdFrom = (request: Request): string => request.user!.id;

export const packingController = {
	list: asyncHandler(async (request: Request, response: Response) => {
		const result = await packingService.listItems(
			tripIdFrom(request),
			userIdFrom(request),
			request.query as unknown as PackingListQuery,
		);
		sendSuccess(response, {
			message: "Packing items fetched successfully",
			data: { items: result.items, summary: result.summary },
			meta: result.meta,
		});
	}),

	create: asyncHandler(async (request: Request, response: Response) => {
		const item = await packingService.addItem(
			tripIdFrom(request),
			userIdFrom(request),
			request.body as CreatePackingItemInput,
		);
		sendSuccess(response, {
			statusCode: 201,
			message: "Packing item created successfully",
			data: item,
		});
	}),

	createBulk: asyncHandler(async (request: Request, response: Response) => {
		const items = await packingService.addItemsBulk(
			tripIdFrom(request),
			userIdFrom(request),
			request.body as CreatePackingItemsBulkInput,
		);
		sendSuccess(response, {
			statusCode: 201,
			message: "Packing items created successfully",
			data: items,
		});
	}),

	update: asyncHandler(async (request: Request, response: Response) => {
		const item = await packingService.updateItem(
			tripIdFrom(request),
			itemIdFrom(request),
			userIdFrom(request),
			request.body as UpdatePackingItemInput,
		);
		sendSuccess(response, {
			message: "Packing item updated successfully",
			data: item,
		});
	}),

	remove: asyncHandler(async (request: Request, response: Response) => {
		const itemId = itemIdFrom(request);
		await packingService.deleteItem(tripIdFrom(request), itemId, userIdFrom(request));
		sendSuccess(response, {
			message: "Packing item deleted successfully",
			data: { id: itemId },
		});
	}),
};
