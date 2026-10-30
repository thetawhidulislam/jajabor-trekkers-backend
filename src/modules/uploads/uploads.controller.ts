import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/ApiResponse";
import { uploadsService } from "./uploads.service";
import type { UploadFolder } from "./uploads.validation";

export const uploadsController = {
	createSignature: asyncHandler(async (request: Request, response: Response) => {
		const result = uploadsService.createSignature((request.body as { folder: UploadFolder }).folder);
		sendSuccess(response, {
			message: "Image upload signature created successfully",
			data: result,
		});
	}),
};
