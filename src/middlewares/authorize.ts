import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";

export const authorize = (allowedRoles: Array<"USER" | "ADMIN">) =>
	asyncHandler(async (request, _response, next) => {
		if (!request.user) {
			return next(ApiError.unauthorized("Authentication required"));
		}

		const userRole = (request.user.role ?? "USER") as "USER" | "ADMIN";

		if (!allowedRoles.includes(userRole)) {
			return next(ApiError.forbidden("You do not have permission to access this resource"));
		}

		next();
	});

export const requireAdmin = authorize(["ADMIN"]);
