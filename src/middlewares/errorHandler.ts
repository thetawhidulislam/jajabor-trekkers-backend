import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { env } from "../config/env";
import { ApiError } from "../utils/ApiError";
import { logger } from "../utils/logger";

const isMalformedJson = (error: unknown): boolean =>
	error instanceof SyntaxError &&
	"status" in error &&
	error.status === 400 &&
	"type" in error &&
	error.type === "entity.parse.failed";

export const errorHandler: ErrorRequestHandler = (error: unknown, _request, response, _next) => {
	if (error instanceof ApiError) {
		response.status(error.statusCode).json({
			success: false,
			message: error.message,
			...(error.errors ? { errors: error.errors } : {}),
		});
		return;
	}

	if (error instanceof ZodError) {
		response.status(400).json({
			success: false,
			message: "Request validation failed",
			errors: error.issues.map((issue) => ({
				field: issue.path.map(String).join("."),
				message: issue.message,
			})),
		});
		return;
	}

	if (isMalformedJson(error)) {
		response.status(400).json({ success: false, message: "Invalid JSON payload" });
		return;
	}

	logger.error("Unhandled request error:", error);
	const message = env.NODE_ENV === "production" ? "Internal server error" : error instanceof Error ? error.message : "Internal server error";
	response.status(500).json({ success: false, message });
};
