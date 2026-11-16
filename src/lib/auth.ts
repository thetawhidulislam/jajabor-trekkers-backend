import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { toNodeHandler } from "better-auth/node";

import { env } from "../config/env";
import { logger } from "../utils/logger";
import { sendEmail } from "./email";
import { prisma } from "./prisma";

const escapeHtml = (value: string): string =>
	value.replace(/[&<>"']/g, (character) => {
		switch (character) {
			case "&":
				return "&amp;";
			case "<":
				return "&lt;";
			case ">":
				return "&gt;";
			case "\"":
				return "&quot;";
			default:
				return "&#39;";
		}
	});

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
		resetPasswordTokenExpiresIn: 60 * 60,
		revokeSessionsOnPasswordReset: true,
		sendResetPassword: async ({ user, token }) => {
			const resetUrl = `${env.CLIENT_URL.replace(/\/+$/, "")}/reset-password?token=${encodeURIComponent(token)}`;
			const safeResetUrl = escapeHtml(resetUrl);
			const text = [
				`Hello ${user.name},`,
				"",
				"Use the link below to reset your Jajabor Trekkers password. This link expires in 1 hour.",
				resetUrl,
				"",
				"If you did not request a password reset, you can ignore this email.",
			].join("\n");
			const html = `
				<div style="margin:0;padding:32px 16px;background-color:#f3f6f1;font-family:Arial,sans-serif;color:#183b2b">
					<div style="max-width:560px;margin:0 auto;padding:32px;background-color:#ffffff;border-radius:12px">
						<p style="margin:0 0 12px;color:#e87524;font-size:13px;font-weight:bold;letter-spacing:1px">JAJABOR TREKKERS</p>
						<h1 style="margin:0 0 16px;color:#183b2b;font-size:24px">Reset your password</h1>
						<p style="line-height:1.6">Hello ${escapeHtml(user.name)},</p>
						<p style="line-height:1.6">Use the button below to choose a new password. This link expires in 1 hour.</p>
						<p style="margin:28px 0">
							<a href="${safeResetUrl}" style="display:inline-block;padding:13px 22px;background-color:#e87524;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold">Reset password</a>
						</p>
						<p style="line-height:1.6">If the button does not work, copy and paste this link into your browser:</p>
						<p style="line-height:1.6;word-break:break-all"><a href="${safeResetUrl}" style="color:#183b2b">${safeResetUrl}</a></p>
						<p style="margin:24px 0 0;color:#526357;font-size:13px;line-height:1.6">If you did not request a password reset, you can ignore this email.</p>
					</div>
				</div>
			`;

			void sendEmail({
				to: user.email,
				subject: "Reset your Jajabor Trekkers password",
				html,
				text,
			}).catch(() => {
				logger.error("Could not send password reset email");
			});
		},
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
