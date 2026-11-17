import { z } from "zod";
import { authenticationDetails, errorResponse, registry } from "./registry";

const authErrorSchema = z.unknown();
const authSuccessSchema = z.unknown();
const jsonBody = (schema: z.ZodType) => ({ content: { "application/json": { schema } } });

registry.registerPath({
	method: "post",
	path: "/api/auth/sign-up/email",
	tags: ["Better Auth"],
	summary: "Create an account with email and passwords",
	...authenticationDetails("public"),
	request: {
		body: jsonBody(z.object({
			name: z.string(),
			email: z.email(),
			password: z.string(),
			image: z.string().optional(),
			callbackURL: z.string().optional(),
		})),
	},
	responses: {
		200: { description: "Account created and session established.", content: { "application/json": { schema: authSuccessSchema } } },
		400: { description: "Invalid sign-up details.", content: { "application/json": { schema: authErrorSchema } } },
	},
});

registry.registerPath({
	method: "post",
	path: "/api/auth/sign-in/email",
	tags: ["Better Auth"],
	summary: "Sign in with email and password",
	...authenticationDetails("public"),
	request: {
		body: jsonBody(z.object({
			email: z.email(),
			password: z.string(),
			callbackURL: z.string().optional(),
			rememberMe: z.boolean().optional(),
		})),
	},
	responses: {
		200: { description: "Signed in; session cookie is set.", content: { "application/json": { schema: authSuccessSchema } } },
		400: { description: "Invalid sign-in details.", content: { "application/json": { schema: authErrorSchema } } },
		401: { description: "Invalid credentials.", content: { "application/json": { schema: authErrorSchema } } },
	},
});

registry.registerPath({
	method: "post",
	path: "/api/auth/sign-out",
	tags: ["Better Auth"],
	summary: "Sign out and clear the session",
	...authenticationDetails("user"),
	responses: {
		200: { description: "Signed out.", content: { "application/json": { schema: authSuccessSchema } } },
		401: errorResponse("Authentication required."),
	},
});

registry.registerPath({
	method: "post",
	path: "/api/auth/request-password-reset",
	tags: ["Better Auth"],
	summary: "Request a password reset email",
	...authenticationDetails("public"),
	request: {
		body: jsonBody(z.object({
			email: z.email(),
		})),
	},
	responses: {
		200: { description: "A reset email was requested, if the email is registered.", content: { "application/json": { schema: authSuccessSchema } } },
		400: { description: "Invalid email address.", content: { "application/json": { schema: authErrorSchema } } },
		429: { description: "Too many password reset requests.", content: { "application/json": { schema: authErrorSchema } } },
	},
});

registry.registerPath({
	method: "post",
	path: "/api/auth/reset-password",
	tags: ["Better Auth"],
	summary: "Set a new password with a reset token",
	...authenticationDetails("public"),
	request: {
		body: jsonBody(z.object({
			newPassword: z.string().min(8),
			token: z.string(),
		})),
	},
	responses: {
		200: { description: "Password changed successfully.", content: { "application/json": { schema: authSuccessSchema } } },
		400: { description: "Invalid or expired reset token.", content: { "application/json": { schema: authErrorSchema } } },
	},
});

registry.registerPath({
	method: "get",
	path: "/api/auth/get-session",
	tags: ["Better Auth"],
	summary: "Get the current session",
	...authenticationDetails("user"),
	responses: {
		200: { description: "Current session, or null when signed out.", content: { "application/json": { schema: authSuccessSchema } } },
		401: errorResponse("Authentication required."),
	},
});