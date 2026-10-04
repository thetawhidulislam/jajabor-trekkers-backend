import { Router } from "express";

export const apiRouter = Router();

apiRouter.get("/health", (_request, response) => {
	response.status(200).json({
		success: true,
		message: "API is healthy",
		data: { status: "ok" },
	});
});
