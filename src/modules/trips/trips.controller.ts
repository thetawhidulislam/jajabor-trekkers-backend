import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/ApiResponse";
import { tripsService } from "./trips.service";
import type {
	CreateTripInput,
	InviteMemberInput,
	ListInvitationsQuery,
	ListMembersQuery,
	ListTripsQuery,
	RespondInvitationInput,
	UpdateTripInput,
	UpdateTripStatusInput,
} from "./trips.types";

const userIdFrom = (request: Request): string => request.user!.id;

export const tripsController = {
	create: asyncHandler(async (request: Request, response: Response) => {
		const trip = await tripsService.createTrip(request.body as CreateTripInput, userIdFrom(request));
		sendSuccess(response, {
			statusCode: 201,
			message: "Trip created successfully",
			data: trip,
		});
	}),

	listMine: asyncHandler(async (request: Request, response: Response) => {
		const result = await tripsService.listMyTrips(
			userIdFrom(request),
			request.query as unknown as ListTripsQuery,
		);
		sendSuccess(response, {
			message: "Trips fetched successfully",
			data: result.trips,
			meta: result.meta,
		});
	}),

	get: asyncHandler(async (request: Request, response: Response) => {
		const trip = await tripsService.getTrip(request.params.id as string, userIdFrom(request));
		sendSuccess(response, {
			message: "Trip fetched successfully",
			data: trip,
		});
	}),

	update: asyncHandler(async (request: Request, response: Response) => {
		const trip = await tripsService.updateTrip(
			request.params.id as string,
			userIdFrom(request),
			request.body as UpdateTripInput,
		);
		sendSuccess(response, {
			message: "Trip updated successfully",
			data: trip,
		});
	}),

	updateStatus: asyncHandler(async (request: Request, response: Response) => {
		const trip = await tripsService.updateTripStatus(
			request.params.id as string,
			userIdFrom(request),
			request.body as UpdateTripStatusInput,
		);
		sendSuccess(response, {
			message: "Trip status updated successfully",
			data: trip,
		});
	}),

	remove: asyncHandler(async (request: Request, response: Response) => {
		await tripsService.deleteTrip(request.params.id as string, userIdFrom(request));
		sendSuccess(response, {
			message: "Trip deleted successfully",
			data: { id: request.params.id },
		});
	}),

	listInvitations: asyncHandler(async (request: Request, response: Response) => {
		const result = await tripsService.listInvitations(
			userIdFrom(request),
			request.query as unknown as ListInvitationsQuery,
		);
		sendSuccess(response, {
			message: "Invitations fetched successfully",
			data: result.invitations,
			meta: result.meta,
		});
	}),

	inviteMember: asyncHandler(async (request: Request, response: Response) => {
		const invitee = await tripsService.inviteMember(
			request.params.id as string,
			userIdFrom(request),
			request.body as InviteMemberInput,
		);
		sendSuccess(response, {
			statusCode: 201,
			message: "Invitation created successfully",
			data: invitee,
		});
	}),

	respondToInvitation: asyncHandler(async (request: Request, response: Response) => {
		const result = await tripsService.respondToInvitation(
			request.params.id as string,
			userIdFrom(request),
			request.body as RespondInvitationInput,
		);
		sendSuccess(response, {
			message: "Invitation response recorded successfully",
			data: result,
		});
	}),

	listMembers: asyncHandler(async (request: Request, response: Response) => {
		const result = await tripsService.listMembers(
			request.params.id as string,
			userIdFrom(request),
			request.query as unknown as ListMembersQuery,
		);
		sendSuccess(response, {
			message: "Trip members fetched successfully",
			data: result.members,
			meta: result.meta,
		});
	}),

	removeMember: asyncHandler(async (request: Request, response: Response) => {
		await tripsService.removeMember(
			request.params.id as string,
			userIdFrom(request),
			request.params.userId as string,
		);
		sendSuccess(response, {
			message: "Trip member removed successfully",
			data: { userId: request.params.userId },
		});
	}),
};
