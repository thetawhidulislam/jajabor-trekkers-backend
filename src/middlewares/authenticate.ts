import type { NextFunction, Request, Response } from "express";
import { auth } from "../lib/auth";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";

export const authenticate = asyncHandler(async (request: Request, _response: Response, next: NextFunction) => {
	const headers = new Headers();
	for (const [key, value] of Object.entries(request.headers)) {
		if (value === undefined) {
			continue;
		}

		if (Array.isArray(value)) {
			for (const item of value) {
				headers.append(key, item);
			}
			continue;
		}

		headers.set(key, value);
	}

	const session = await auth.api.getSession({
		asResponse: false,
		headers,
	});

	if (!session?.session || !session.user) {
		return next(ApiError.unauthorized("Authentication required"));
	}

	request.user = session.user as Express.User;
	request.session = session.session as NonNullable<typeof request.session>;
	next();
});
