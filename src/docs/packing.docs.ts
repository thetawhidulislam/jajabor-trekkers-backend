import {
	createPackingItemSchema,
	createPackingItemsBulkSchema,
	packingItemParamsSchema,
	packingListQuerySchema,
	packingTripParamsSchema,
	updatePackingItemSchema,
} from "../modules/packing/packing.validation";
import { authenticationDetails, errorResponses, registry, successResponse } from "./registry";

registry.registerPath({
	method: "get",
	path: "/api/v1/trips/{tripId}/packing",
	tags: ["Packing"],
	summary: "List packing items with filters and summary",
	...authenticationDetails("user"),
	request: { params: packingTripParamsSchema, query: packingListQuerySchema },
	responses: { 200: successResponse("Paginated packing items and trip summary."), ...errorResponses(400, 401, 404) },
});

registry.registerPath({
	method: "post",
	path: "/api/v1/trips/{tripId}/packing",
	tags: ["Packing"],
	summary: "Add a packing item",
	...authenticationDetails("user"),
	request: {
		params: packingTripParamsSchema,
		body: { content: { "application/json": { schema: createPackingItemSchema } } },
	},
	responses: { 201: successResponse("Packing item created."), ...errorResponses(400, 401, 404, 409) },
});

registry.registerPath({
	method: "post",
	path: "/api/v1/trips/{tripId}/packing/bulk",
	tags: ["Packing"],
	summary: "Add multiple packing items atomically",
	...authenticationDetails("user"),
	request: {
		params: packingTripParamsSchema,
		body: { content: { "application/json": { schema: createPackingItemsBulkSchema } } },
	},
	responses: { 201: successResponse("Packing items created."), ...errorResponses(400, 401, 404, 409) },
});

registry.registerPath({
	method: "patch",
	path: "/api/v1/trips/{tripId}/packing/{itemId}",
	tags: ["Packing"],
	summary: "Update or mark a packing item",
	...authenticationDetails("user"),
	request: {
		params: packingItemParamsSchema,
		body: { content: { "application/json": { schema: updatePackingItemSchema } } },
	},
	responses: { 200: successResponse("Packing item updated."), ...errorResponses(400, 401, 403, 404, 409) },
});

registry.registerPath({
	method: "delete",
	path: "/api/v1/trips/{tripId}/packing/{itemId}",
	tags: ["Packing"],
	summary: "Delete a packing item",
	...authenticationDetails("user"),
	request: { params: packingItemParamsSchema },
	responses: { 200: successResponse("Packing item deleted."), ...errorResponses(401, 403, 404, 409) },
});