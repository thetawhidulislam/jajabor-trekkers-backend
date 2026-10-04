import { ApiError } from "../../utils/ApiError";
import { buildMeta, getPagination } from "../../utils/pagination";
import { findUserById, findUsersForAdmin, updateUserById } from "./users.repository";
import type { UpdateMeInput, UserListQuery, UserPublicProfile } from "./users.types";

export const usersService = {
	async getCurrentUser(userId: string): Promise<UserPublicProfile> {
		const user = await findUserById(userId);
		if (!user) {
			throw ApiError.notFound("User not found");
		}
		return user;
	},

	async listUsers(query: UserListQuery) {
		const pagination = getPagination({ page: query.page, limit: query.limit });
		const { users, total } = await findUsersForAdmin({
			page: pagination.page,
			limit: pagination.limit,
			search: typeof query.search === "string" ? query.search : undefined,
		});

		return {
			users,
			meta: buildMeta(total, pagination.page, pagination.limit),
		};
	},

	async updateCurrentUser(userId: string, data: UpdateMeInput): Promise<UserPublicProfile> {
		const existingUser = await findUserById(userId);
		if (!existingUser) {
			throw ApiError.notFound("User not found");
		}

		return updateUserById(userId, data);
	},
};
