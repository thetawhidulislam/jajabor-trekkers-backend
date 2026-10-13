import { ApiError } from "../../utils/ApiError";
import { assertTripAccess } from "../trips/trips.service";
import {
	createItineraryItem,
	deleteItineraryItem as removeItineraryItem,
	findItineraryItem,
	findItineraryItems,
	findItineraryItemsByIds,
	findMaximumSortOrder,
	reorderItineraryItems,
	updateItineraryItem,
} from "./itinerary.repository";
import type {
	CreateItineraryItemInput,
	ReorderItineraryInput,
	UpdateItineraryItemInput,
} from "./itinerary.types";

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

const tripDurationDays = (startDate: Date, endDate: Date): number =>
	Math.floor((endDate.getTime() - startDate.getTime()) / MILLISECONDS_PER_DAY) + 1;

const mapItem = (item: Awaited<ReturnType<typeof findItineraryItems>>[number]) => ({
	id: item.id,
	dayNumber: item.dayNumber,
	startTime: item.startTime,
	title: item.title,
	description: item.description,
	location: item.location,
	estimatedCost: item.estimatedCost === null ? null : Number(item.estimatedCost),
	sortOrder: item.sortOrder,
	createdAt: item.createdAt,
	updatedAt: item.updatedAt,
});

const assertWritableTrip = async (tripId: string, userId: string) => {
	const access = await assertTripAccess(tripId, userId, { ownerOnly: true });
	if (access.trip.status === "COMPLETED" || access.trip.status === "CANCELLED") {
		throw ApiError.conflict("Itinerary cannot be changed for a completed or cancelled trip");
	}
	return access;
};

const assertDayInTrip = (dayNumber: number, startDate: Date, endDate: Date): void => {
	const duration = tripDurationDays(startDate, endDate);
	if (dayNumber < 1 || dayNumber > duration) {
		throw ApiError.badRequest(`dayNumber must be between 1 and ${duration} for this trip`);
	}
};

const sortItems = (items: Awaited<ReturnType<typeof findItineraryItems>>) => items.sort((left, right) => {
	if (left.sortOrder !== right.sortOrder) {
		return left.sortOrder - right.sortOrder;
	}
	return (left.startTime ?? "\uffff").localeCompare(right.startTime ?? "\uffff");
});

export const itineraryService = {
	async listItinerary(tripId: string, userId: string) {
		const { trip } = await assertTripAccess(tripId, userId);
		const duration = tripDurationDays(trip.startDate, trip.endDate);
		const items = sortItems(await findItineraryItems(tripId));
		const days = Array.from({ length: duration }, (_unused, index) => {
			const dayNumber = index + 1;
			return {
				dayNumber,
				items: items.filter((item) => item.dayNumber === dayNumber).map(mapItem),
			};
		});
		const totalEstimatedCost = items.reduce((total, item) =>
			total + (item.estimatedCost === null ? 0 : Number(item.estimatedCost)), 0);
		return { days, totalEstimatedCost };
	},

	async createItem(tripId: string, userId: string, input: CreateItineraryItemInput) {
		const { trip } = await assertWritableTrip(tripId, userId);
		assertDayInTrip(input.dayNumber, trip.startDate, trip.endDate);
		const sortOrder = input.sortOrder ?? ((await findMaximumSortOrder(tripId, input.dayNumber) ?? -1) + 1);
		const item = await createItineraryItem(tripId, { ...input, sortOrder });
		return mapItem(item);
	},

	async updateItem(
		tripId: string,
		itemId: string,
		userId: string,
		input: UpdateItineraryItemInput,
	) {
		const { trip } = await assertWritableTrip(tripId, userId);
		const existing = await findItineraryItem(tripId, itemId);
		if (!existing) {
			throw ApiError.notFound("Itinerary item not found");
		}
		if (input.dayNumber !== undefined) {
			assertDayInTrip(input.dayNumber, trip.startDate, trip.endDate);
		}
		const item = await updateItineraryItem(itemId, input);
		return mapItem(item);
	},

	async reorderItems(tripId: string, userId: string, input: ReorderItineraryInput) {
		const { trip } = await assertWritableTrip(tripId, userId);
		assertDayInTrip(input.dayNumber, trip.startDate, trip.endDate);
		const items = await findItineraryItemsByIds(tripId, input.dayNumber, input.itemIds);
		if (items.length !== input.itemIds.length) {
			throw ApiError.badRequest("All itemIds must belong to this trip and requested day");
		}
		await reorderItineraryItems(input.itemIds);
		return { dayNumber: input.dayNumber, itemIds: input.itemIds };
	},

	async deleteItem(tripId: string, itemId: string, userId: string): Promise<void> {
		await assertWritableTrip(tripId, userId);
		const existing = await findItineraryItem(tripId, itemId);
		if (!existing) {
			throw ApiError.notFound("Itinerary item not found");
		}
		await removeItineraryItem(itemId);
	},
};
