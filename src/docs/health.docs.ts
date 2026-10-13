import { authenticationDetails, registry, successResponse } from "./registry";

registry.registerPath({
	method: "get",
	path: "/api/v1/health",
	tags: ["System"],
	summary: "Check API health",
	...authenticationDetails("public"),
	responses: { 200: successResponse("API is healthy.") },
});