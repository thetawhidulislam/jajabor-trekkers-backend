import { Router } from "express";
import { adminCategoriesRouter, categoriesRouter } from "../modules/categories/categories.routes";
import {
	adminDestinationsRouter,
	destinationsRouter,
} from "../modules/destinations/destinations.routes";
import { itineraryRouter } from "../modules/itinerary/itinerary.routes";
import { packingRouter } from "../modules/packing/packing.routes";
import { tripsRouter } from "../modules/trips/trips.routes";
import { usersRouter } from "../modules/users/users.routes";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/ApiResponse";

export const apiRouter = Router();

apiRouter.use("/users", usersRouter);
apiRouter.use("/categories", categoriesRouter);
apiRouter.use("/destinations", destinationsRouter);
apiRouter.use("/admin/categories", adminCategoriesRouter);
apiRouter.use("/admin/destinations", adminDestinationsRouter);
apiRouter.use("/trips", tripsRouter);
apiRouter.use("/trips/:tripId/itinerary", itineraryRouter);
apiRouter.use("/trips/:tripId/packing", packingRouter);

apiRouter.get(
	"/health",
	asyncHandler(async (_request, response) => {
		sendSuccess(response, {
			message: "API is healthy",
			data: { status: "ok" },
		});
	}),
);
