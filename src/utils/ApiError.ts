export interface ApiErrorDetail {
	field: string;
	message: string;
}

export class ApiError extends Error {
	readonly statusCode: number;
	readonly errors?: ApiErrorDetail[];
	readonly isOperational = true;

	constructor(statusCode: number, message: string, errors?: ApiErrorDetail[]) {
		super(message);
		this.name = "ApiError";
		this.statusCode = statusCode;
		this.errors = errors;
		Object.setPrototypeOf(this, new.target.prototype);
	}

	static badRequest(message: string, errors?: ApiErrorDetail[]): ApiError {
		return new ApiError(400, message, errors);
	}

	static unauthorized(message = "Unauthorized"): ApiError {
		return new ApiError(401, message);
	}

	static forbidden(message = "Forbidden"): ApiError {
		return new ApiError(403, message);
	}

	static notFound(message = "Not found"): ApiError {
		return new ApiError(404, message);
	}

	static conflict(message = "Conflict"): ApiError {
		return new ApiError(409, message);
	}
}
