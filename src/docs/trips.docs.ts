import {
	createTripSchema,
	inviteMemberSchema,
	listInvitationsQuerySchema,
	listMembersQuerySchema,
	listTripsQuerySchema,
	respondInvitationSchema,
	tripIdParamsSchema,
	tripMemberParamsSchema,
	updateTripSchema,
	updateTripStatusSchema,
} from "../modules/trips/trips.validation";
import { authenticationDetails, errorResponses, registry, successResponse } from "./registry";

registry.registerPath({
	method: "get",
	path: "/api/v1/trips/invitations",
	tags: ["Trips"],
	summary: "List my pending trip invitations",
	...authenticationDetails("user"),
	request: { query: listInvitationsQuerySchema },
	responses: { 200: successResponse("Paginated pending invitations."), ...errorResponses(400, 401) },
});

registry.registerPath({
	method: "post",
	path: "/api/v1/trips",
	tags: ["Trips"],
	summary: "Create a trip with the current user as owner",
	...authenticationDetails("user"),
	request: {
		body: {
			content: {
				"application/json": {
					schema: createTripSchema.openapi({ example: {
						title: "Bandarban Weekend",
						startDate: "2026-11-12T00:00:00.000Z",
						endDate: "2026-11-14T00:00:00.000Z",
						budget: 8000,
						notes: "Meet at the bus terminal at 8 AM.",
					} }),
				},
			},
		},
	},
	responses: { 201: successResponse("Trip created."), ...errorResponses(400, 401) },
});

registry.registerPath({
	method: "get",
	path: "/api/v1/trips",
	tags: ["Trips"],
	summary: "List trips I have accepted membership in",
	...authenticationDetails("user"),
	request: { query: listTripsQuerySchema },
	responses: { 200: successResponse("Paginated trips."), ...errorResponses(400, 401) },
});

registry.registerPath({
	method: "patch",
	path: "/api/v1/trips/{id}/members/me/respond",
	tags: ["Trips"],
	summary: "Accept or decline my trip invitation",
	...authenticationDetails("user"),
	request: {
		params: tripIdParamsSchema,
		body: { content: { "application/json": { schema: respondInvitationSchema } } },
	},
	responses: { 200: successResponse("Invitation response recorded."), ...errorResponses(400, 401, 404) },
});

registry.registerPath({
	method: "post",
	path: "/api/v1/trips/{id}/members",
	tags: ["Trips"],
	summary: "Invite a registered user to the trip",
	...authenticationDetails("user"),
	request: {
		params: tripIdParamsSchema,
		body: { content: { "application/json": { schema: inviteMemberSchema } } },
	},
	responses: { 201: successResponse("Invitation created."), ...errorResponses(400, 401, 403, 404, 409) },
});

registry.registerPath({
	method: "get",
	path: "/api/v1/trips/{id}/members",
	tags: ["Trips"],
	summary: "List accepted trip members",
	...authenticationDetails("user"),
	request: { params: tripIdParamsSchema, query: listMembersQuerySchema },
	responses: { 200: successResponse("Paginated trip members."), ...errorResponses(400, 401, 404) },
});

registry.registerPath({
	method: "delete",
	path: "/api/v1/trips/{id}/members/{userId}",
	tags: ["Trips"],
	summary: "Remove a member or leave the trip",
	...authenticationDetails("user"),
	request: { params: tripMemberParamsSchema },
	responses: { 200: successResponse("Trip member removed."), ...errorResponses(401, 403, 404, 409) },
});

registry.registerPath({
	method: "patch",
	path: "/api/v1/trips/{id}/status",
	tags: ["Trips"],
	summary: "Advance or cancel trip status",
	...authenticationDetails("user"),
	request: {
		params: tripIdParamsSchema,
		body: { content: { "application/json": { schema: updateTripStatusSchema } } },
	},
	responses: { 200: successResponse("Trip status updated."), ...errorResponses(400, 401, 403, 404, 409) },
});

registry.registerPath({
	method: "get",
	path: "/api/v1/trips/{id}",
	tags: ["Trips"],
	summary: "Get trip details",
	...authenticationDetails("user"),
	request: { params: tripIdParamsSchema },
	responses: { 200: successResponse("Trip details."), ...errorResponses(401, 404) },
});

registry.registerPath({
	method: "patch",
	path: "/api/v1/trips/{id}",
	tags: ["Trips"],
	summary: "Update trip details as the owner",
	...authenticationDetails("user"),
	request: {
		params: tripIdParamsSchema,
		body: { content: { "application/json": { schema: updateTripSchema } } },
	},
	responses: { 200: successResponse("Trip updated."), ...errorResponses(400, 401, 403, 404, 409) },
});

registry.registerPath({
	method: "delete",
	path: "/api/v1/trips/{id}",
	tags: ["Trips"],
	summary: "Delete a trip without financial records",
	...authenticationDetails("user"),
	request: { params: tripIdParamsSchema },
	responses: { 200: successResponse("Trip deleted."), ...errorResponses(401, 403, 404, 409) },
});