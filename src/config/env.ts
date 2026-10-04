import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
	NODE_ENV: z.enum(["development", "test", "production"]),
	PORT: z.coerce.number().int().positive(),
	DATABASE_URL: z.string().min(1),
	BETTER_AUTH_SECRET: z.string().min(1),
	BETTER_AUTH_URL: z.string().url(),
	CLIENT_URL: z.string().url(),
	CLOUDINARY_CLOUD_NAME: z.string().optional(),
	CLOUDINARY_API_KEY: z.string().optional(),
	CLOUDINARY_SECRET: z.string().optional(),
	WEATHER_API_KEY: z.string().optional(),
	MAP_API_KEY: z.string().optional(),
	AI_API_KEY: z.string().optional(),
	REDIS_URL: z.string().optional(),
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
