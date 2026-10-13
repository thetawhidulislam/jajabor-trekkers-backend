import {
	createItineraryItemSchema,
	itineraryItemParamsSchema,
	itineraryTripParamsSchema,
	reorderItinerarySchema,
	updateItineraryItemSchema,
} from "../modules/itinerary/itinerary.validation";
import { authenticationDetails, errorResponses, registry, successResponse } from "./registry";

registry.registerPath({
	method: "get",
	path: "/api/v1/trips/{tripId}/itinerary",
	tags: ["Itinerary"],
	summary: "Get itinerary grouped by trip day",
	...authenticationDetails("user"),
	request: { params: itineraryTripParamsSchema },
	responses: { 200: successResponse("Itinerary and estimated-cost total."), ...errorResponses(401, 404) },
});

registry.registerPath({
	method: "post",
	path: "/api/v1/trips/{tripId}/itinerary",
	tags: ["Itinerary"],
	summary: "Add an itinerary item",
	...authenticationDetails("user"),
	request: {
		params: itineraryTripParamsSchema,
		body: { content: { "application/json": { schema: createItineraryItemSchema } } },
	},
	responses: { 201: successResponse("Itinerary item created."), ...errorResponses(400, 401, 403, 404, 409) },
});

registry.registerPath({
	method: "patch",
	path: "/api/v1/trips/{tripId}/itinerary/reorder",
	tags: ["Itinerary"],
	summary: "Reorder items within one itinerary day",
	...authenticationDetails("user"),
	request: {
		params: itineraryTripParamsSchema,
		body: { content: { "application/json": { schema: reorderItinerarySchema } } },
	},
	responses: { 200: successResponse("Itinerary items reordered."), ...errorResponses(400, 401, 403, 404, 409) },
});

registry.registerPath({
	method: "patch",
	path: "/api/v1/trips/{tripId}/itinerary/{itemId}",
	tags: ["Itinerary"],
	summary: "Update an itinerary item",
	...authenticationDetails("user"),
	request: {
		params: itineraryItemParamsSchema,
		body: { content: { "application/json": { schema: updateItineraryItemSchema } } },
	},
	responses: { 200: successResponse("Itinerary item updated."), ...errorResponses(400, 401, 403, 404, 409) },
});

registry.registerPath({
	method: "delete",
	path: "/api/v1/trips/{tripId}/itinerary/{itemId}",
	tags: ["Itinerary"],
	summary: "Delete an itinerary item",
	...authenticationDetails("user"),
	request: { params: itineraryItemParamsSchema },
	responses: { 200: successResponse("Itinerary item deleted."), ...errorResponses(401, 403, 404, 409) },
});