import {
	extendZodWithOpenApi,
	OpenAPIRegistry,
	type ResponseConfig,
} from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

export const SuccessEnvelopeSchema = registry.register("SuccessEnvelope", z.object({
	success: z.literal(true),
	message: z.string(),
	data: z.unknown(),
	meta: z.unknown().optional(),
}));

export const ErrorEnvelopeSchema = registry.register("ErrorEnvelope", z.object({
	success: z.literal(false),
	message: z.string(),
	errors: z.array(z.object({
		field: z.string(),
		message: z.string(),
	})).optional(),
}));

export const PaginationQuerySchema = registry.register("PaginationQuery", z.object({
	page: z.number().int().positive().optional(),
	limit: z.number().int().positive().max(50).optional(),
}));

export const PaginationMetaSchema = registry.register("PaginationMeta", z.object({
	total: z.number().int().nonnegative(),
	page: z.number().int().positive(),
	limit: z.number().int().positive(),
	totalPages: z.number().int().nonnegative(),
}));

registry.registerComponent("securitySchemes", "sessionCookie", {
	type: "apiKey",
	in: "cookie",
	name: "better-auth.session_token",
	description: "Better Auth HTTP-only session cookie.",
});

export type AuthRequirement = "public" | "user" | "admin";

export const authenticationDetails = (auth: AuthRequirement) => ({
	description: `Authentication requirement: ${auth}.`,
	...(auth === "public" ? { security: [] } : { security: [{ sessionCookie: [] }] }),
});

export const successResponse = (description: string): ResponseConfig => ({
	description,
	content: { "application/json": { schema: SuccessEnvelopeSchema } },
});

export const errorResponse = (description: string): ResponseConfig => ({
	description,
	content: { "application/json": { schema: ErrorEnvelopeSchema } },
});

const errorDescriptions: Record<number, string> = {
	400: "Invalid request or business rule validation failed.",
	401: "Authentication required.",
	403: "Authenticated user is not authorized.",
	404: "Resource not found.",
	409: "The request conflicts with the current resource state.",
};

export const errorResponses = (...statusCodes: number[]): Record<number, ResponseConfig> =>
	Object.fromEntries(statusCodes.map((statusCode) => [
		statusCode,
		errorResponse(errorDescriptions[statusCode] ?? "Request failed."),
	]));