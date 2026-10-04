import { auth } from "../lib/auth";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";

export const authenticate = asyncHandler(async (request, _response, next) => {
	const session = await auth.api.getSession({
		asResponse: false,
		headers: request.headers,
	});

	if (!session?.session || !session.user) {
		return next(ApiError.unauthorized("Authentication required"));
	}

	request.user = session.user as Express.User;
	request.session = session.session as NonNullable<typeof request.session>;
	next();
});
