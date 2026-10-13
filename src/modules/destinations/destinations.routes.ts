import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import { validate } from "../../middlewares/validate";
import { destinationsController } from "./destinations.controller";
import {
	adminDestinationListQuerySchema,
	createDestinationSchema,
	destinationIdParamsSchema,
	destinationListQuerySchema,
	destinationSlugParamsSchema,
	updateDestinationFeaturedSchema,
	updateDestinationSchema,
	updateDestinationStatusSchema,
} from "./destinations.validation";

export const destinationsRouter = Router();
export const adminDestinationsRouter = Router();

destinationsRouter.get("/", validate({ query: destinationListQuerySchema }), destinationsController.listPublic);
destinationsRouter.get(
	"/:slug",
	validate({ params: destinationSlugParamsSchema }),
	destinationsController.getPublic,
);

adminDestinationsRouter.use(authenticate, authorize(["ADMIN"]));
adminDestinationsRouter.get(
	"/",
	validate({ query: adminDestinationListQuerySchema }),
	destinationsController.listAdmin,
);
adminDestinationsRouter.post(
	"/",
	validate({ body: createDestinationSchema }),
	destinationsController.create,
);
adminDestinationsRouter.get(
	"/:id",
	validate({ params: destinationIdParamsSchema }),
	destinationsController.getAdmin,
);
adminDestinationsRouter.patch(
	"/:id/status",
	validate({ params: destinationIdParamsSchema, body: updateDestinationStatusSchema }),
	destinationsController.updateStatus,
);
adminDestinationsRouter.patch(
	"/:id/featured",
	validate({ params: destinationIdParamsSchema, body: updateDestinationFeaturedSchema }),
	destinationsController.updateFeatured,
);
adminDestinationsRouter.patch(
	"/:id",
	validate({ params: destinationIdParamsSchema, body: updateDestinationSchema }),
	destinationsController.update,
);
adminDestinationsRouter.delete(
	"/:id",
	validate({ params: destinationIdParamsSchema }),
	destinationsController.remove,
);
