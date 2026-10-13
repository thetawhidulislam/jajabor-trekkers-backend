import {
	adminDestinationListQuerySchema,
	createDestinationSchema,
	destinationIdParamsSchema,
	destinationListQuerySchema,
	destinationSlugParamsSchema,
	updateDestinationFeaturedSchema,
	updateDestinationSchema,
	updateDestinationStatusSchema,
} from "../modules/destinations/destinations.validation";
import { authenticationDetails, errorResponses, registry, successResponse } from "./registry";

registry.registerPath({
	method: "get",
	path: "/api/v1/destinations",
	tags: ["Destinations"],
	summary: "List published destinations",
	...authenticationDetails("public"),
	request: { query: destinationListQuerySchema },
	responses: {
		200: successResponse("Paginated published destination cards."),
		...errorResponses(400),
	},
});

registry.registerPath({
	method: "get",
	path: "/api/v1/destinations/{slug}",
	tags: ["Destinations"],
	summary: "Get a published destination by slug",
	...authenticationDetails("public"),
	request: { params: destinationSlugParamsSchema },
	responses: {
		200: successResponse("Destination detail."),
		...errorResponses(404),
	},
});

registry.registerPath({
	method: "get",
	path: "/api/v1/admin/destinations",
	tags: ["Destinations"],
	summary: "List destinations across all statuses",
	...authenticationDetails("admin"),
	request: { query: adminDestinationListQuerySchema },
	responses: {
		200: successResponse("Paginated admin destination list."),
		...errorResponses(400, 401, 403),
	},
});

registry.registerPath({
	method: "post",
	path: "/api/v1/admin/destinations",
	tags: ["Destinations"],
	summary: "Create a draft destination",
	...authenticationDetails("admin"),
	request: { body: { content: { "application/json": { schema: createDestinationSchema } } } },
	responses: {
		201: successResponse("Destination created as a draft."),
		...errorResponses(400, 401, 403, 404, 409),
	},
});

registry.registerPath({
	method: "get",
	path: "/api/v1/admin/destinations/{id}",
	tags: ["Destinations"],
	summary: "Get a destination by ID, including non-published destinations",
	...authenticationDetails("admin"),
	request: { params: destinationIdParamsSchema },
	responses: {
		200: successResponse("Destination detail for administrators."),
		...errorResponses(401, 403, 404),
	},
});

registry.registerPath({
	method: "patch",
	path: "/api/v1/admin/destinations/{id}",
	tags: ["Destinations"],
	summary: "Update a destination",
	...authenticationDetails("admin"),
	request: {
		params: destinationIdParamsSchema,
		body: { content: { "application/json": { schema: updateDestinationSchema } } },
	},
	responses: {
		200: successResponse("Destination updated."),
		...errorResponses(400, 401, 403, 404, 409),
	},
});

registry.registerPath({
	method: "patch",
	path: "/api/v1/admin/destinations/{id}/status",
	tags: ["Destinations"],
	summary: "Change destination publication status",
	...authenticationDetails("admin"),
	request: {
		params: destinationIdParamsSchema,
		body: { content: { "application/json": { schema: updateDestinationStatusSchema } } },
	},
	responses: {
		200: successResponse("Destination status updated."),
		...errorResponses(400, 401, 403, 404),
	},
});

registry.registerPath({
	method: "patch",
	path: "/api/v1/admin/destinations/{id}/featured",
	tags: ["Destinations"],
	summary: "Set destination featured state",
	...authenticationDetails("admin"),
	request: {
		params: destinationIdParamsSchema,
		body: { content: { "application/json": { schema: updateDestinationFeaturedSchema } } },
	},
	responses: {
		200: successResponse("Destination featured state updated."),
		...errorResponses(400, 401, 403, 404),
	},
});

registry.registerPath({
	method: "delete",
	path: "/api/v1/admin/destinations/{id}",
	tags: ["Destinations"],
	summary: "Delete a draft destination",
	...authenticationDetails("admin"),
	request: { params: destinationIdParamsSchema },
	responses: {
		200: successResponse("Destination deleted."),
		...errorResponses(401, 403, 404, 409),
	},
});