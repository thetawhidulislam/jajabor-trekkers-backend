import { z } from "zod";
import { authenticationDetails, errorResponse, registry } from "./registry";

const authErrorSchema = z.unknown();
const authSuccessSchema = z.unknown();
const jsonBody = (schema: z.ZodType) => ({ content: { "application/json": { schema } } });

registry.registerPath({
	method: "post",
	path: "/api/auth/sign-up/email",
	tags: ["Better Auth"],
	summary: "Create an account with email and password",
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