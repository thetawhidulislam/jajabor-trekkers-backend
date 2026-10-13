import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate";
import { validate } from "../../middlewares/validate";
import { itineraryController } from "./itinerary.controller";
import {
	createItineraryItemSchema,
	itineraryItemParamsSchema,
	itineraryTripParamsSchema,
	reorderItinerarySchema,
	updateItineraryItemSchema,
} from "./itinerary.validation";

export const itineraryRouter = Router({ mergeParams: true });

itineraryRouter.use(authenticate);
itineraryRouter.get(
	"/",
	validate({ params: itineraryTripParamsSchema }),
	itineraryController.list,
);
itineraryRouter.post(
	"/",
	validate({ params: itineraryTripParamsSchema, body: createItineraryItemSchema }),
	itineraryController.create,
);
itineraryRouter.patch(
	"/reorder",
	validate({ params: itineraryTripParamsSchema, body: reorderItinerarySchema }),
	itineraryController.reorder,
);
itineraryRouter.patch(
	"/:itemId",
	validate({ params: itineraryItemParamsSchema, body: updateItineraryItemSchema }),
	itineraryController.update,
);
itineraryRouter.delete(
	"/:itemId",
	validate({ params: itineraryItemParamsSchema }),
	itineraryController.remove,
);
