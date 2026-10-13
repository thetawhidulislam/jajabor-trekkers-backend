import {
	adminReviewsQuerySchema,
	createReviewSchema,
	destinationSlugParamsSchema,
	publicReviewsQuerySchema,
	reviewIdParamsSchema,
	updateReviewSchema,
	updateReviewVisibilitySchema,
} from "../modules/reviews/reviews.validation";
import { authenticationDetails, errorResponses, registry, successResponse } from "./registry";

registry.registerPath({
	method: "get",
	path: "/api/v1/destinations/{slug}/reviews",
	tags: ["Reviews"],
	summary: "List public reviews and rating distribution",
	...authenticationDetails("public"),
	request: { params: destinationSlugParamsSchema, query: publicReviewsQuerySchema },
	responses: { 200: successResponse("Paginated visible reviews and rating summary."), ...errorResponses(400, 404) },
});

registry.registerPath({
	method: "get",
	path: "/api/v1/destinations/{slug}/reviews/me",
	tags: ["Reviews"],
	summary: "Get my review and review eligibility",
	...authenticationDetails("user"),
	request: { params: destinationSlugParamsSchema },
	responses: { 200: successResponse("Current user's review and eligibility."), ...errorResponses(401, 404) },
});

registry.registerPath({
	method: "post",
	path: "/api/v1/destinations/{slug}/reviews",
	tags: ["Reviews"],
	summary: "Create a review after completing a trip",
	...authenticationDetails("user"),
	request: {
		params: destinationSlugParamsSchema,
		body: { content: { "application/json": { schema: createReviewSchema } } },
	},
	responses: { 201: successResponse("Review created."), ...errorResponses(400, 401, 403, 404, 409) },
});

registry.registerPath({
	method: "patch",
	path: "/api/v1/destinations/{slug}/reviews/me",
	tags: ["Reviews"],
	summary: "Update my review",
	...authenticationDetails("user"),
	request: {
		params: destinationSlugParamsSchema,
		body: { content: { "application/json": { schema: updateReviewSchema } } },
	},
	responses: { 200: successResponse("Review updated."), ...errorResponses(400, 401, 403, 404) },
});

registry.registerPath({
	method: "delete",
	path: "/api/v1/destinations/{slug}/reviews/me",
	tags: ["Reviews"],
	summary: "Delete my review",
	...authenticationDetails("user"),
	request: { params: destinationSlugParamsSchema },
	responses: { 200: successResponse("Review deleted."), ...errorResponses(401, 404) },
});

registry.registerPath({
	method: "get",
	path: "/api/v1/admin/reviews",
	tags: ["Reviews"],
	summary: "List reviews with optional visibility, destination, and rating filters",
	...authenticationDetails("admin"),
	request: { query: adminReviewsQuerySchema },
	responses: { 200: successResponse("Paginated administrator review list."), ...errorResponses(400, 401, 403) },
});

registry.registerPath({
	method: "patch",
	path: "/api/v1/admin/reviews/{id}/visibility",
	tags: ["Reviews"],
	summary: "Hide or show a review",
	...authenticationDetails("admin"),
	request: {
		params: reviewIdParamsSchema,
		body: { content: { "application/json": { schema: updateReviewVisibilitySchema } } },
	},
	responses: { 200: successResponse("Review visibility updated."), ...errorResponses(400, 401, 403, 404) },
});

registry.registerPath({
	method: "delete",
	path: "/api/v1/admin/reviews/{id}",
	tags: ["Reviews"],
	summary: "Delete a review as an administrator",
	...authenticationDetails("admin"),
	request: { params: reviewIdParamsSchema },
	responses: { 200: successResponse("Review deleted."), ...errorResponses(401, 403, 404) },
});