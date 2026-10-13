import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/ApiResponse";
import { categoriesService } from "./categories.service";
import type { CategoryInput } from "./categories.types";

export const categoriesController = {
	listCategories: asyncHandler(async (_request: Request, response: Response) => {
		const categories = await categoriesService.listCategories();
		sendSuccess(response, {
			message: "Categories fetched successfully",
			data: categories,
		});
	}),

	createCategory: asyncHandler(async (request: Request, response: Response) => {
		const category = await categoriesService.createCategory(request.body as CategoryInput);
		sendSuccess(response, {
			statusCode: 201,
			message: "Category created successfully",
			data: category,
		});
	}),

	updateCategory: asyncHandler(async (request: Request, response: Response) => {
		const category = await categoriesService.updateCategory(request.params.id as string, request.body as CategoryInput);
		sendSuccess(response, {
			message: "Category updated successfully",
			data: category,
		});
	}),

	deleteCategory: asyncHandler(async (request: Request, response: Response) => {
		await categoriesService.deleteCategory(request.params.id as string);
		sendSuccess(response, {
			message: "Category deleted successfully",
			data: { id: request.params.id },
		});
	}),
};