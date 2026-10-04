import { Router } from "express";
import { usersRouter } from "../modules/users/users.routes";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/ApiResponse";

export const apiRouter = Router();

apiRouter.use("/users", usersRouter);

apiRouter.get(
	"/health",
	asyncHandler(async (_request, response) => {
		sendSuccess(response, {
			message: "API is healthy",
			data: { status: "ok" },
		});
	}),
);
