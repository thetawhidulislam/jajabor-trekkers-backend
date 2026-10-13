import type { Prisma } from "../../generated/prisma";
import { ApiError } from "../../utils/ApiError";
import { buildMeta, getPagination } from "../../utils/pagination";
import {
	acceptInvitation,
	countMemberFinancialReferences,
	countTripExpensesAndSettlements,
	createPendingMember,
	createTripWithOwner,
	declineInvitation,
	deleteTrip as removeTrip,
	deleteTripMember,
	findAcceptedTripMember,
	findPendingInvitation,
	findPendingInvitations,
	findPublishedDestination,
	findTripMember,
	findTripMembers,
	findTripsForMember,
	findUserByEmail,
	hasItineraryAfterDay,
	updateTrip as saveTrip,
} from "./trips.repository";
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

type AcceptedTripMember = NonNullable<Awaited<ReturnType<typeof findAcceptedTripMember>>>;
type TripStatus = AcceptedTripMember["trip"]["status"];
type TripOrder = Prisma.TripOrderByWithRelationInput[];

interface TripAccessOptions {
	ownerOnly?: boolean;
}

const mapDestination = (destination: AcceptedTripMember["trip"]["destination"]) =>
	destination === null ? null : {
	id: destination.id,
	name: destination.name,
	slug: destination.slug,
	coverImage: destination.coverImage,
};

const mapTripDetails = (trip: AcceptedTripMember["trip"], myRole: string) => ({
	id: trip.id,
	title: trip.title,
	destinationId: trip.destinationId,
	startDate: trip.startDate,
	endDate: trip.endDate,
	budget: trip.budget === null ? null : Number(trip.budget),
	status: trip.status,
	notes: trip.notes,
	createdAt: trip.createdAt,
	updatedAt: trip.updatedAt,
	owner: trip.owner,
	destination: mapDestination(trip.destination),
	members: trip.members.map(({ user, role }) => ({
		id: user.id,
		name: user.name,
		image: user.image,
		role,
	})),
	myRole,
});

const orderByFor = (sort: ListTripsQuery["sort"]): TripOrder => {
	switch (sort) {
		case "startDate_desc":
			return [{ startDate: "desc" }, { createdAt: "desc" }];
		case "newest":
			return [{ createdAt: "desc" }];
		case "startDate_asc":
			return [{ startDate: "asc" }, { createdAt: "desc" }];
	}
};

const isPrismaError = (error: unknown, code: string): boolean =>
	typeof error === "object" && error !== null && "code" in error && error.code === code;

const tripDurationDays = (startDate: Date, endDate: Date): number =>
	Math.floor((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)) + 1;

export const assertTripAccess = async (
	tripId: string,
	userId: string,
	options: TripAccessOptions = {},
): Promise<{ trip: AcceptedTripMember["trip"]; member: AcceptedTripMember }> => {
	const member = await findAcceptedTripMember(tripId, userId);
	if (!member) {
		throw ApiError.notFound("Trip not found");
	}
	if (options.ownerOnly && member.role !== "OWNER") {
		throw ApiError.forbidden("Only the trip owner can do this");
	}
	return { trip: member.trip, member };
};

export const tripsService = {
	async createTrip(input: CreateTripInput, ownerId: string) {
	if (input.destinationId && !await findPublishedDestination(input.destinationId)) {
			throw ApiError.badRequest("Destination must exist and be published");
		}
		const trip = await createTripWithOwner(input, ownerId);
		const access = await assertTripAccess(trip.id, ownerId);
		return mapTripDetails(access.trip, access.member.role);
	},

	async listMyTrips(userId: string, query: ListTripsQuery) {
		const pagination = getPagination({ page: query.page, limit: query.limit });
		const result = await findTripsForMember({
			userId,
			status: query.status,
			orderBy: orderByFor(query.sort),
			skip: pagination.skip,
			take: pagination.limit,
		});
		return {
			trips: result.trips.map((trip) => {
				const currentMember = trip.members.find((member) => member.userId === userId);
				return {
					id: trip.id,
					title: trip.title,
					status: trip.status,
					startDate: trip.startDate,
					endDate: trip.endDate,
					budget: trip.budget === null ? null : Number(trip.budget),
					destination: mapDestination(trip.destination),
					memberCount: trip.members.length,
					myRole: currentMember?.role,
				};
			}),
			meta: buildMeta(result.total, pagination.page, pagination.limit),
		};
	},

	async getTrip(tripId: string, userId: string) {
		const access = await assertTripAccess(tripId, userId);
		return mapTripDetails(access.trip, access.member.role);
	},

	async updateTrip(tripId: string, userId: string, input: UpdateTripInput) {
		const { trip, member } = await assertTripAccess(tripId, userId, { ownerOnly: true });
		if (trip.status === "COMPLETED" || trip.status === "CANCELLED") {
			throw ApiError.conflict("Completed or cancelled trips cannot be updated");
		}
		const startDate = input.startDate ?? trip.startDate;
		const endDate = input.endDate ?? trip.endDate;
		if (endDate < startDate) {
			throw ApiError.badRequest("endDate must be on or after startDate");
		}
		if (
			(input.startDate !== undefined || input.endDate !== undefined)
			&& await hasItineraryAfterDay(tripId, tripDurationDays(startDate, endDate))
		) {
			throw ApiError.conflict("Trip dates cannot be shortened while itinerary items exist beyond the new duration");
		}
		if (input.destinationId && !await findPublishedDestination(input.destinationId)) {
			throw ApiError.badRequest("Destination must exist and be published");
		}

		try {
			await saveTrip(tripId, input);
		} catch (error) {
			if (isPrismaError(error, "P2025")) {
				throw ApiError.notFound("Trip not found");
			}
			throw error;
		}
		return mapTripDetails((await assertTripAccess(tripId, userId)).trip, member.role);
	},

	async updateTripStatus(tripId: string, userId: string, input: UpdateTripStatusInput) {
		const { trip, member } = await assertTripAccess(tripId, userId, { ownerOnly: true });
		const allowedTransitions: Record<TripStatus, TripStatus[]> = {
			PLANNING: ["UPCOMING", "CANCELLED"],
			UPCOMING: ["ONGOING", "CANCELLED"],
			ONGOING: ["COMPLETED", "CANCELLED"],
			COMPLETED: [],
			CANCELLED: [],
		};
		if (!allowedTransitions[trip.status].includes(input.status)) {
			throw ApiError.conflict(`Cannot change trip status from ${trip.status} to ${input.status}`);
		}
		await saveTrip(tripId, { status: input.status });
		return mapTripDetails((await assertTripAccess(tripId, userId)).trip, member.role);
	},

	async deleteTrip(tripId: string, userId: string): Promise<void> {
		await assertTripAccess(tripId, userId, { ownerOnly: true });
		if (await countTripExpensesAndSettlements(tripId) > 0) {
			throw ApiError.conflict("Cancel the trip instead");
		}
		try {
			await removeTrip(tripId);
		} catch (error) {
			if (isPrismaError(error, "P2025")) {
				throw ApiError.notFound("Trip not found");
			}
			throw error;
		}
	},

	async listInvitations(userId: string, query: ListInvitationsQuery) {
		const pagination = getPagination({ page: query.page, limit: query.limit });
		const result = await findPendingInvitations(userId, pagination.skip, pagination.limit);
		return {
			invitations: result.invitations.map((invitation) => ({
				tripId: invitation.tripId,
				title: invitation.trip.title,
				startDate: invitation.trip.startDate,
				endDate: invitation.trip.endDate,
				destination: invitation.trip.destination?.name ?? null,
				owner: invitation.trip.owner.name,
				invitedAt: invitation.createdAt,
			})),
			meta: buildMeta(result.total, pagination.page, pagination.limit),
		};
	},

	async inviteMember(tripId: string, ownerId: string, input: InviteMemberInput) {
		const { trip } = await assertTripAccess(tripId, ownerId, { ownerOnly: true });
		if (trip.status === "COMPLETED" || trip.status === "CANCELLED") {
			throw ApiError.conflict("Members cannot be invited to a completed or cancelled trip");
		}
		const user = await findUserByEmail(input.email.toLowerCase());
		if (!user) {
			throw ApiError.notFound("No user found with this email");
		}
		if (user.id === ownerId) {
			throw ApiError.conflict("You cannot invite yourself to your trip");
		}
		if (await findTripMember(tripId, user.id)) {
			throw ApiError.conflict("This user is already a member or has a pending invitation");
		}
		try {
			const created = await createPendingMember(tripId, user.id);
			return created.user;
		} catch (error) {
			if (isPrismaError(error, "P2002")) {
				throw ApiError.conflict("This user is already a member or has a pending invitation");
			}
			throw error;
		}
	},

	async respondToInvitation(tripId: string, userId: string, input: RespondInvitationInput) {
		const invitation = await findPendingInvitation(tripId, userId);
		if (!invitation) {
			throw ApiError.notFound("Invitation not found");
		}
		if (input.action === "decline") {
			await declineInvitation(tripId, userId);
			return { tripId, action: "declined" as const };
		}
		const member = await acceptInvitation(tripId, userId);
		return { tripId, action: "accepted" as const, role: member.role, status: member.status };
	},

	async listMembers(tripId: string, userId: string, query: ListMembersQuery) {
		const { member } = await assertTripAccess(tripId, userId);
		const includePending = member.role === "OWNER";
		const pagination = getPagination({ page: query.page, limit: query.limit });
		const result = await findTripMembers({
			tripId,
			includePending,
			skip: pagination.skip,
			take: pagination.limit,
		});
		return {
			members: result.members.map((tripMember) => ({
				id: tripMember.user.id,
				name: tripMember.user.name,
				image: tripMember.user.image,
				...(includePending ? { status: tripMember.status, email: tripMember.user.email } : {}),
			})),
			meta: buildMeta(result.total, pagination.page, pagination.limit),
		};
	},

	async removeMember(tripId: string, requesterId: string, targetUserId: string): Promise<void> {
		const { member: requester } = await assertTripAccess(tripId, requesterId);
		if (requester.role !== "OWNER" && requesterId !== targetUserId) {
			throw ApiError.forbidden("You can only remove yourself from the trip");
		}
		const target = await findTripMember(tripId, targetUserId);
		if (!target) {
			throw ApiError.notFound("Trip member not found");
		}
		if (target.role === "OWNER") {
			throw ApiError.conflict("The trip owner cannot leave or be removed");
		}
		if (await countMemberFinancialReferences(tripId, targetUserId) > 0) {
			throw ApiError.conflict("This member has financial records in the trip and cannot be removed");
		}
		try {
			await deleteTripMember(tripId, targetUserId);
		} catch (error) {
			if (isPrismaError(error, "P2025")) {
				throw ApiError.notFound("Trip member not found");
			}
			throw error;
		}
	},
};
