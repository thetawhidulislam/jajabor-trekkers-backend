import type { RequestHandler } from "express";
import { ApiError } from "../utils/ApiError";

export const notFound: RequestHandler = (_request, _response, next) => {
	next(ApiError.notFound("Route not found"));
};
