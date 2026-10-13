import "./auth.docs";
import "./users.docs";
import "./categories.docs";
import "./destinations.docs";
import "./trips.docs";
import "./itinerary.docs";
import "./packing.docs";
import "./expenses.docs";
import "./reviews.docs";
import "./health.docs";
import { OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";
import { env } from "../config/env";
import { registry } from "./registry";

const generator = new OpenApiGeneratorV3(registry.definitions);

export const openApiDocument = generator.generateDocument({
	openapi: "3.0.3",
	info: {
		title: "Jajabor Trekkers API",
		version: "1.0.0",
	},
	servers: [{ url: `http://localhost:${env.PORT}` }],
	tags: [
		{ name: "Better Auth" },
		{ name: "Users" },
		{ name: "Categories" },
		{ name: "Destinations" },
		{ name: "Trips" },
		{ name: "Itinerary" },
		{ name: "Packing" },
		{ name: "Expenses" },
		{ name: "Reviews" },
		{ name: "System" },
	],
});