import type { Prisma } from "../../generated/prisma";
import { prisma } from "../../lib/prisma";
import type { UpdateMeInput, UserPublicProfile } from "./users.types";

const userSelect = {
	id: true,
	name: true,
	email: true,
	image: true,
	phone: true,
	role: true,
	emailVerified: true,
	createdAt: true,
	updatedAt: true,
} as const;

export const findUserById = async (userId: string): Promise<UserPublicProfile | null> => {
	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: userSelect,
	});

	return user as UserPublicProfile | null;
};

export const findUsersForAdmin = async ({
	page,
	limit,
	search,
}: {
	page: number;
	limit: number;
	search?: string;
}) => {
	const where: Prisma.UserWhereInput = search
		? {
			OR: [
				{ email: { contains: search, mode: "insensitive" } },
				{ name: { contains: search, mode: "insensitive" } },
			],
		}
		: {};

	const [users, total] = await Promise.all([
		prisma.user.findMany({
			where,
			select: userSelect,
			orderBy: { createdAt: "desc" },
			skip: (page - 1) * limit,
			take: limit,
		}),
		prisma.user.count({ where }),
	]);

	return {
		users: users as UserPublicProfile[],
		total,
	};
};

export const updateUserById = async (userId: string, data: UpdateMeInput): Promise<UserPublicProfile> => {
	const user = await prisma.user.update({
		where: { id: userId },
		data,
		select: userSelect,
	});

	return user as UserPublicProfile;
};
