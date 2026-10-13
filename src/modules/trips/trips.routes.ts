import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate";
import { validate } from "../../middlewares/validate";
import { tripsController } from "./trips.controller";
import {
	createTripSchema,
	inviteMemberSchema,
	listInvitationsQuerySchema,
	listMembersQuerySchema,
	listTripsQuerySchema,
	respondInvitationSchema,
	tripIdParamsSchema,
	tripMemberParamsSchema,
	updateTripSchema,
	updateTripStatusSchema,
} from "./trips.validation";

export const tripsRouter = Router();

tripsRouter.use(authenticate);

tripsRouter.get(
	"/invitations",
	validate({ query: listInvitationsQuerySchema }),
	tripsController.listInvitations,
);
tripsRouter.post("/", validate({ body: createTripSchema }), tripsController.create);
tripsRouter.get("/", validate({ query: listTripsQuerySchema }), tripsController.listMine);
tripsRouter.patch(
	"/:id/members/me/respond",
	validate({ params: tripIdParamsSchema, body: respondInvitationSchema }),
	tripsController.respondToInvitation,
);
tripsRouter.post(
	"/:id/members",
	validate({ params: tripIdParamsSchema, body: inviteMemberSchema }),
	tripsController.inviteMember,
);
tripsRouter.get(
	"/:id/members",
	validate({ params: tripIdParamsSchema, query: listMembersQuerySchema }),
	tripsController.listMembers,
);
tripsRouter.delete(
	"/:id/members/:userId",
	validate({ params: tripMemberParamsSchema }),
	tripsController.removeMember,
);
tripsRouter.patch(
	"/:id/status",
	validate({ params: tripIdParamsSchema, body: updateTripStatusSchema }),
	tripsController.updateStatus,
);
tripsRouter.get("/:id", validate({ params: tripIdParamsSchema }), tripsController.get);
tripsRouter.patch(
	"/:id",
	validate({ params: tripIdParamsSchema, body: updateTripSchema }),
	tripsController.update,
);
tripsRouter.delete("/:id", validate({ params: tripIdParamsSchema }), tripsController.remove);
