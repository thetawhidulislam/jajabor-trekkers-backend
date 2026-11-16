import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
	NODE_ENV: z.enum(["development", "test", "production"]),
	PORT: z.coerce.number().int().positive(),
	DATABASE_URL: z.string().min(1),
	BETTER_AUTH_SECRET: z.string().min(1),
	BETTER_AUTH_URL: z.string().url(),
	CLIENT_URL: z.string().url(),
	CLOUDINARY_CLOUD_NAME: z.string().trim().optional(),
	CLOUDINARY_API_KEY: z.string().trim().optional(),
	CLOUDINARY_API_SECRET: z.string().trim().optional(),
	RESEND_API_KEY: z.string().trim().min(1).optional(),
	EMAIL_FROM: z.string().trim().min(1).optional(),
	WEATHER_API_KEY: z.string().optional(),
	MAP_API_KEY: z.string().optional(),
	AI_API_KEY: z.string().optional(),
	REDIS_URL: z.string().optional(),
}).superRefine((values, context) => {
	if (values.RESEND_API_KEY && !values.EMAIL_FROM) {
		context.addIssue({
			code: "custom",
			path: ["EMAIL_FROM"],
			message: "EMAIL_FROM is required when RESEND_API_KEY is set",
		});
	}

	if (values.NODE_ENV === "production") {
		for (const key of ["RESEND_API_KEY", "EMAIL_FROM"] as const) {
			if (!values[key]) {
				context.addIssue({
					code: "custom",
					path: [key],
					message: `${key} is required in production`,
				});
			}
		}
	}
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
	console.error("Invalid environment variables:");
	for (const issue of parsedEnv.error.issues) {
		console.error(`- ${issue.path.join(".")}: ${issue.message}`);
	}
	process.exit(1);
}

export const env = parsedEnv.data;
