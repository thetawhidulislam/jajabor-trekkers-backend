import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/ApiResponse";
import { usersService } from "./users.service";

export const usersController = {
	getMe: asyncHandler(async (request: Request, response: Response) => {
		const user = await usersService.getCurrentUser(request.user!.id);
		sendSuccess(response, {
			message: "User profile fetched successfully",
			data: user,
		});
	}),

	listUsers: asyncHandler(async (request: Request, response: Response) => {
		const result = await usersService.listUsers({
			page: request.query.page,
			limit: request.query.limit,
			search: typeof request.query.search === "string" ? request.query.search : undefined,
		});

		sendSuccess(response, {
			message: "Users fetched successfully",
			data: result.users,
			meta: result.meta,
		});
	}),

	updateMe: asyncHandler(async (request: Request, response: Response) => {
		const user = await usersService.updateCurrentUser(request.user!.id, request.body);
		sendSuccess(response, {
			message: "User profile updated successfully",
			data: user,
		});
	}),
};
