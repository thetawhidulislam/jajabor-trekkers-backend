import {
	categoryIdParamsSchema,
	createCategorySchema,
	updateCategorySchema,
} from "../modules/categories/categories.validation";
import { authenticationDetails, errorResponses, registry, successResponse } from "./registry";

registry.registerPath({
	method: "get",
	path: "/api/v1/categories",
	tags: ["Categories"],
	summary: "List categories",
	...authenticationDetails("public"),
	responses: { 200: successResponse("Categories sorted by name.") },
});

registry.registerPath({
	method: "post",
	path: "/api/v1/admin/categories",
	tags: ["Categories"],
	summary: "Create a category",
	...authenticationDetails("admin"),
	request: { body: { content: { "application/json": { schema: createCategorySchema } } } },
	responses: {
		201: successResponse("Category created."),
		...errorResponses(400, 401, 403, 409),
	},
});

registry.registerPath({
	method: "patch",
	path: "/api/v1/admin/categories/{id}",
	tags: ["Categories"],
	summary: "Update a category name",
	...authenticationDetails("admin"),
	request: {
		params: categoryIdParamsSchema,
		body: { content: { "application/json": { schema: updateCategorySchema } } },
	},
	responses: {
		200: successResponse("Category updated."),
		...errorResponses(400, 401, 403, 404, 409),
	},
});

registry.registerPath({
	method: "delete",
	path: "/api/v1/admin/categories/{id}",
	tags: ["Categories"],
	summary: "Delete a category not used by destinations",
	...authenticationDetails("admin"),
	request: { params: categoryIdParamsSchema },
	responses: {
		200: successResponse("Category deleted."),
		...errorResponses(401, 403, 404, 409),
	},
});