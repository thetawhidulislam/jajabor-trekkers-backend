import { ApiError } from "../../utils/ApiError";
import { buildMeta, getPagination } from "../../utils/pagination";
import { assertTripAccess } from "../trips/trips.service";
import {
	createPackingItem,
	createPackingItems,
	deletePackingItem as removePackingItem,
	findGearItem,
	findPackingItem,
	findPackingItems,
	isAcceptedTripMember,
	updatePackingItem,
} from "./packing.repository";
import type {
	CreatePackingItemInput,
	CreatePackingItemsBulkInput,
	PackingListQuery,
	UpdatePackingItemInput,
} from "./packing.types";

const protectedFields: Array<keyof UpdatePackingItemInput> = [
	"name",
	"category",
	"quantity",
	"assignedToId",
	"gearItemId",
];

const isPrismaError = (error: unknown, code: string): boolean =>
	typeof error === "object" && error !== null && "code" in error && error.code === code;

const mapPackingItem = (item: Awaited<ReturnType<typeof findPackingItem>>) => {
	if (!item) {
		return null;
	}
	return {
		id: item.id,
		name: item.name,
		category: item.category,
		quantity: item.quantity,
		isPacked: item.isPacked,
		gearItem: item.gearItem,
		assignedTo: item.assignedTo,
		addedBy: item.addedBy,
	};
};

const assertWritableTrip = async (tripId: string, userId: string) => {
	const access = await assertTripAccess(tripId, userId);
	if (access.trip.status === "COMPLETED" || access.trip.status === "CANCELLED") {
		throw ApiError.conflict("Packing list cannot be changed for a completed or cancelled trip");
	}
	return access;
};

const validateReferences = async (
	tripId: string,
	input: { gearItemId?: string | null; assignedToId?: string | null },
): Promise<void> => {
	if (input.gearItemId && !await findGearItem(input.gearItemId)) {
		throw ApiError.badRequest("gearItemId must reference an existing gear item");
	}
	if (input.assignedToId && !await isAcceptedTripMember(tripId, input.assignedToId)) {
		throw ApiError.badRequest("assignedToId must be an accepted member of this trip");
	}
};

export const packingService = {
	async listItems(tripId: string, userId: string, query: PackingListQuery) {
		await assertTripAccess(tripId, userId);
		const pagination = getPagination({ page: query.page, limit: query.limit });
		const assignedToId = query.assigned === "me" ? userId : query.assigned;
		const result = await findPackingItems({
			tripId,
			category: query.category,
			isPacked: query.packed,
			assignedToId,
			skip: pagination.skip,
			take: pagination.limit,
		});
		return {
			items: result.items.map((item) => mapPackingItem(item)),
			summary: { total: result.summaryTotal, packed: result.packed },
			meta: buildMeta(result.total, pagination.page, pagination.limit),
		};
	},

	async addItem(tripId: string, userId: string, input: CreatePackingItemInput) {
		await assertWritableTrip(tripId, userId);
		await validateReferences(tripId, input);
		const item = await createPackingItem(tripId, userId, input);
		return mapPackingItem(item);
	},

	async addItemsBulk(tripId: string, userId: string, input: CreatePackingItemsBulkInput) {
		await assertWritableTrip(tripId, userId);
		await Promise.all(input.items.map((item) => validateReferences(tripId, item)));
		const items = await createPackingItems(tripId, userId, input.items);
		return items.map((item) => mapPackingItem(item));
	},

	async updateItem(tripId: string, itemId: string, userId: string, input: UpdatePackingItemInput) {
		const { member } = await assertWritableTrip(tripId, userId);
		const existing = await findPackingItem(tripId, itemId);
		if (!existing) {
			throw ApiError.notFound("Packing item not found");
		}
		const changesProtectedField = Object.keys(input).some((field) =>
			protectedFields.includes(field as keyof UpdatePackingItemInput));
		if (changesProtectedField && member.role !== "OWNER" && existing.addedById !== userId) {
			throw ApiError.forbidden("Only the trip owner or item creator can change these fields");
		}
		await validateReferences(tripId, input);
		try {
			const item = await updatePackingItem(itemId, input);
			return mapPackingItem(item);
		} catch (error) {
			if (isPrismaError(error, "P2025")) {
				throw ApiError.notFound("Packing item not found");
			}
			throw error;
		}
	},

	async deleteItem(tripId: string, itemId: string, userId: string): Promise<void> {
		const { member } = await assertWritableTrip(tripId, userId);
		const existing = await findPackingItem(tripId, itemId);
		if (!existing) {
			throw ApiError.notFound("Packing item not found");
		}
		if (member.role !== "OWNER" && existing.addedById !== userId) {
			throw ApiError.forbidden("Only the trip owner or item creator can delete this item");
		}
		try {
			await removePackingItem(itemId);
		} catch (error) {
			if (isPrismaError(error, "P2025")) {
				throw ApiError.notFound("Packing item not found");
			}
			throw error;
		}
	},
};
