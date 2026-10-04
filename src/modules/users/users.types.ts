export type UserRole = "USER" | "ADMIN";

export interface UserPublicProfile {
	id: string;
	name: string | null;
	email: string;
	image: string | null;
	phone: string | null;
	role: UserRole;
	emailVerified: boolean;
	createdAt: Date;
	updatedAt: Date;
}

export interface UserListQuery {
	page?: unknown;
	limit?: unknown;
	search?: unknown;
}

export interface UpdateMeInput {
	name?: string;
	phone?: string | null;
	image?: string | null;
}
