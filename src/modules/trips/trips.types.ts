import type { z } from "zod";
import type {
	createTripSchema,
	inviteMemberSchema,
	listInvitationsQuerySchema,
	listMembersQuerySchema,
	listTripsQuerySchema,
	respondInvitationSchema,
	updateTripSchema,
	updateTripStatusSchema,
} from "./trips.validation";

export type CreateTripInput = z.infer<typeof createTripSchema>;
export type UpdateTripInput = z.infer<typeof updateTripSchema>;
export type UpdateTripStatusInput = z.infer<typeof updateTripStatusSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type RespondInvitationInput = z.infer<typeof respondInvitationSchema>;
export type ListTripsQuery = z.infer<typeof listTripsQuerySchema>;
export type ListInvitationsQuery = z.infer<typeof listInvitationsQuerySchema>;
export type ListMembersQuery = z.infer<typeof listMembersQuerySchema>;
