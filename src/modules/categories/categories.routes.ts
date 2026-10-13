import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import { validate } from "../../middlewares/validate";
import { categoriesController } from "./categories.controller";
import {
	categoryIdParamsSchema,
	createCategorySchema,
	updateCategorySchema,
} from "./categories.validation";

export const categoriesRouter = Router();
export const adminCategoriesRouter = Router();

categoriesRouter.get("/", categoriesController.listCategories);

adminCategoriesRouter.use(authenticate, authorize(["ADMIN"]));
adminCategoriesRouter.post("/", validate({ body: createCategorySchema }), categoriesController.createCategory);
adminCategoriesRouter.patch(
	"/:id",
	validate({ params: categoryIdParamsSchema, body: updateCategorySchema }),
	categoriesController.updateCategory,
);
adminCategoriesRouter.delete(
	"/:id",
	validate({ params: categoryIdParamsSchema }),
	categoriesController.deleteCategory,
);