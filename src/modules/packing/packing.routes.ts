import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate";
import { validate } from "../../middlewares/validate";
import { packingController } from "./packing.controller";
import {
	createPackingItemSchema,
	createPackingItemsBulkSchema,
	packingItemParamsSchema,
	packingListQuerySchema,
	packingTripParamsSchema,
	updatePackingItemSchema,
} from "./packing.validation";

export const packingRouter = Router({ mergeParams: true });

packingRouter.use(authenticate);
packingRouter.get(
	"/",
	validate({ params: packingTripParamsSchema, query: packingListQuerySchema }),
	packingController.list,
);
packingRouter.post(
	"/",
	validate({ params: packingTripParamsSchema, body: createPackingItemSchema }),
	packingController.create,
);
packingRouter.post(
	"/bulk",
	validate({ params: packingTripParamsSchema, body: createPackingItemsBulkSchema }),
	packingController.createBulk,
);
packingRouter.patch(
	"/:itemId",
	validate({ params: packingItemParamsSchema, body: updatePackingItemSchema }),
	packingController.update,
);
packingRouter.delete(
	"/:itemId",
	validate({ params: packingItemParamsSchema }),
	packingController.remove,
);
