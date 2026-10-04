import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { toNodeHandler } from "better-auth/node";

import { env } from "../config/env";
import { prisma } from "./prisma";

export const auth = betterAuth({
	database: prismaAdapter(prisma, {
		provider: "postgresql",
	}),
	secret: env.BETTER_AUTH_SECRET,
	baseURL: env.BETTER_AUTH_URL,
	trustedOrigins: [env.CLIENT_URL, env.BETTER_AUTH_URL],
	emailAndPassword: {
		enabled: true,
		minPasswordLength: 8,
	},
	user: {
		additionalFields: {
			role: {
				type: "string",
				required: false,
				input: false,
				defaultValue: "USER",
			},
			phone: {
				type: "string",
				required: false,
			},
		},
	},
	cookies: {
		sessionToken: {
			options: {
				httpOnly: true,
				sameSite: "lax",
				secure: env.NODE_ENV === "production",
				path: "/",
				// Production cookie settings should be stricter and only used in secure deployments.
				...(env.NODE_ENV === "production"
					? {
						secure: true,
						sameSite: "strict",
					}
					: {}),
			},
		},
	},
	appName: "Jajabor Trekkers",
});

export const authHandler = toNodeHandler(auth);
