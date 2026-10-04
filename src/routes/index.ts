import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/ApiResponse";

export const apiRouter = Router();

apiRouter.get(
	"/health",
	asyncHandler(async (_request, response) => {
		sendSuccess(response, {
			message: "API is healthy",
			data: { status: "ok" },
		});
	}),
);
