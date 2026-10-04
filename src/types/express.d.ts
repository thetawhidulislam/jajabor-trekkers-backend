declare global {
	namespace Express {
		interface User {
			id: string;
			email: string;
			name?: string | null;
			image?: string | null;
			role?: "USER" | "ADMIN" | string;
			emailVerified?: boolean;
			phone?: string | null;
			createdAt?: Date;
			updatedAt?: Date;
		}

		interface Request {
			user?: User;
			session?: {
				id: string;
				token: string;
				userId: string;
				expiresAt: Date;
				createdAt: Date;
				updatedAt: Date;
				ipAddress?: string | null;
				userAgent?: string | null;
			};
		}
	}
}

export {};
