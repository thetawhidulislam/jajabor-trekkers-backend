import type { RequestHandler } from "express";
import { z } from "zod";
import { ApiError } from "../utils/ApiError";

interface RequestSchemas {
	body?: z.ZodType;
	query?: z.ZodType;
	params?: z.ZodType;
}

const parseRequestPart = (schema: z.ZodType, value: unknown, field: string): unknown => {
	const result = schema.safeParse(value);
	if (!result.success) {
		throw ApiError.badRequest(
			"Request validation failed",
			result.error.issues.map((issue) => ({
				field: [field, ...issue.path.map(String)].join("."),
				message: issue.message,
			})),
		);
	}

	return result.data;
};

export const validate = (schemas: RequestSchemas): RequestHandler => (request, _response, next) => {
	try {
		if (schemas.body) {
			request.body = parseRequestPart(schemas.body, request.body, "body");
		}
		if (schemas.query) {
			request.query = parseRequestPart(schemas.query, request.query, "query");
		}
		if (schemas.params) {
			request.params = parseRequestPart(schemas.params, request.params, "params");
		}
		next();
	} catch (error) {
		next(error);
	}
};
