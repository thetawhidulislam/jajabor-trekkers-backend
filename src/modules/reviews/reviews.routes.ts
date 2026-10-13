import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import { validate } from "../../middlewares/validate";
import { reviewsController } from "./reviews.controller";
import {
	adminReviewsQuerySchema,
	createReviewSchema,
	destinationSlugParamsSchema,
	publicReviewsQuerySchema,
	reviewIdParamsSchema,
	updateReviewSchema,
	updateReviewVisibilitySchema,
} from "./reviews.validation";

export const destinationReviewsRouter = Router({ mergeParams: true });
export const adminReviewsRouter = Router();

destinationReviewsRouter.get(
	"/me",
	authenticate,
	validate({ params: destinationSlugParamsSchema }),
	reviewsController.getMine,
);
destinationReviewsRouter.get(
	"/",
	validate({ params: destinationSlugParamsSchema, query: publicReviewsQuerySchema }),
	reviewsController.listPublic,
);
destinationReviewsRouter.post(
	"/",
	authenticate,
	validate({ params: destinationSlugParamsSchema, body: createReviewSchema }),
	reviewsController.create,
);
destinationReviewsRouter.patch(
	"/me",
	authenticate,
	validate({ params: destinationSlugParamsSchema, body: updateReviewSchema }),
	reviewsController.updateMine,
);
destinationReviewsRouter.delete(
	"/me",
	authenticate,
	validate({ params: destinationSlugParamsSchema }),
	reviewsController.deleteMine,
);

adminReviewsRouter.use(authenticate, authorize(["ADMIN"]));
adminReviewsRouter.get(
	"/",
	validate({ query: adminReviewsQuerySchema }),
	reviewsController.listAdmin,
);
adminReviewsRouter.patch(
	"/:id/visibility",
	validate({ params: reviewIdParamsSchema, body: updateReviewVisibilitySchema }),
	reviewsController.setVisibility,
);
adminReviewsRouter.delete(
	"/:id",
	validate({ params: reviewIdParamsSchema }),
	reviewsController.deleteAdmin,
);
