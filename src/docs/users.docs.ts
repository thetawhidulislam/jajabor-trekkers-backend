import { getUsersQuerySchema, updateMeSchema } from "../modules/users/users.validation";
import { authenticationDetails, errorResponses, registry, successResponse } from "./registry";

registry.registerPath({
	method: "get",
	path: "/api/v1/users/me",
	tags: ["Users"],
	summary: "Get the current user's profile",
	...authenticationDetails("user"),
	responses: {
		200: successResponse("Current user profile."),
		...errorResponses(401, 404),
	},
});

registry.registerPath({
	method: "get",
	path: "/api/v1/users",
	tags: ["Users"],
	summary: "List users with pagination and optional search",
	...authenticationDetails("admin"),
	request: { query: getUsersQuerySchema },
	responses: {
		200: successResponse("Paginated user list."),
		...errorResponses(400, 401, 403),
	},
});

registry.registerPath({
	method: "patch",
	path: "/api/v1/users/me",
	tags: ["Users"],
	summary: "Update the current user's profile",
	...authenticationDetails("user"),
	request: { body: { content: { "application/json": { schema: updateMeSchema } } } },
	responses: {
		200: successResponse("Updated user profile."),
		...errorResponses(400, 401, 404),
	},
});