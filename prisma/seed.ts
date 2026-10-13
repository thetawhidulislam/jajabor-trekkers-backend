import "dotenv/config";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { z } from "zod";
import { auth } from "../src/lib/auth";
import { prisma } from "../src/lib/prisma";
import { findUniqueSlug, generateSlug } from "../src/modules/categories/category-slug";

const statusSchema = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);
const imageSchema = z.object({
	url: z.string().url(),
	caption: z.string().trim().max(300).optional(),
	sortOrder: z.number().int().min(0).optional(),
}).strict();

const destinationSchema = z.object({
	name: z.string().trim().min(1).max(160),
	division: z.string().trim().min(1).max(100),
	district: z.string().trim().max(100).nullable().optional(),
	locationText: z.string().trim().max(500).nullable().optional(),
	latitude: z.number().finite().min(-90).max(90).nullable().optional(),
	longitude: z.number().finite().min(-180).max(180).nullable().optional(),
	description: z.string().trim().min(1),
	coverImage: z.string().url(),
	estimatedCostMin: z.number().finite().min(0),
	estimatedCostMax: z.number().finite().min(0),
	recommendedDays: z.number().int().min(1),
	bestTimeToVisit: z.string().trim().max(200).nullable().optional(),
	activities: z.array(z.string().trim().min(1).max(200)),
	difficulty: z.enum(["EASY", "MODERATE", "HARD"]),
	safetyNotes: z.string().trim().max(2000).nullable().optional(),
	permissionRequired: z.boolean().optional(),
	permissionNote: z.string().trim().max(1000).nullable().optional(),
	lastVerifiedAt: z.coerce.date().nullable().optional(),
	categoryName: z.string().trim().min(1).max(100),
	status: statusSchema.optional(),
	images: z.array(imageSchema).optional(),
}).strict().superRefine((destination, context) => {
	if (destination.estimatedCostMin > destination.estimatedCostMax) {
		context.addIssue({
			code: "custom",
			path: ["estimatedCostMax"],
			message: "estimatedCostMax must be greater than or equal to estimatedCostMin",
		});
	}
	if (destination.permissionRequired && !destination.permissionNote?.trim()) {
		context.addIssue({
			code: "custom",
			path: ["permissionNote"],
			message: "permissionNote is required when permissionRequired is true",
		});
	}
});

const seedDataSchema = z.object({
	categories: z.array(z.object({
		name: z.string().trim().min(1).max(100),
	}).strict()).min(1),
	destinations: z.array(destinationSchema).min(1),
}).strict().superRefine((seedData, context) => {
	const categoryNames = new Set<string>();
	seedData.categories.forEach((category, index) => {
		if (categoryNames.has(category.name)) {
			context.addIssue({
				code: "custom",
				path: ["categories", index, "name"],
				message: "Category names must be unique",
			});
		}
		categoryNames.add(category.name);
	});
	seedData.destinations.forEach((destination, index) => {
		if (!categoryNames.has(destination.categoryName)) {
			context.addIssue({
				code: "custom",
				path: ["destinations", index, "categoryName"],
				message: `Unknown category "${destination.categoryName}"; add it to categories first`,
			});
		}
	});
});

type SeedData = z.infer<typeof seedDataSchema>;

interface SeedAdmin {
	name: string;
	email: string;
	password: string;
}

const seedAdminSchema = z.object({
	name: z.string().trim().min(1),
	email: z.email(),
	password: z.string().min(8),
});

const getSeedAdmin = (): SeedAdmin => {
	const name = process.env.SEED_ADMIN_NAME;
	const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
	const password = process.env.SEED_ADMIN_PASSWORD;
	const missing = [
		...(name ? [] : ["SEED_ADMIN_NAME"]),
		...(email ? [] : ["SEED_ADMIN_EMAIL"]),
		...(password ? [] : ["SEED_ADMIN_PASSWORD"]),
	];
	if (missing.length) {
		throw new Error(`Missing required seed environment variable(s): ${missing.join(", ")}`);
	}
	const result = seedAdminSchema.safeParse({ name, email, password });
	if (!result.success) {
		const problems = result.error.issues.map((issue) =>
			`- SEED_ADMIN_${issue.path[0]?.toString().toUpperCase() ?? "CONFIG"}: ${issue.message}`,
		);
		throw new Error(`Invalid seed admin configuration:\n${problems.join("\n")}`);
	}
	return result.data;
};

const loadSeedData = async (): Promise<SeedData> => {
	const filePath = resolve(process.cwd(), "prisma/data/seed-data.json");
	let rawData: unknown;
	try {
		rawData = JSON.parse(await readFile(filePath, "utf8")) as unknown;
	} catch (error) {
		if (error instanceof Error && "code" in error && error.code === "ENOENT") {
			throw new Error(`Seed data file not found: ${filePath}`);
		}
		throw new Error(`Unable to read or parse seed data file: ${filePath}`);
	}

	const result = seedDataSchema.safeParse(rawData);
	if (!result.success) {
		const problems = result.error.issues.map((issue) => {
			const path = issue.path.length ? issue.path.join(".") : "<root>";
			return `- ${path}: ${issue.message}`;
		});
		throw new Error(`Invalid seed data in ${filePath}:\n${problems.join("\n")}`);
	}
	return result.data;
};

const ensureAdmin = async (seedAdmin: SeedAdmin): Promise<{ id: string; created: boolean }> => {
	const existing = await prisma.user.findUnique({
		where: { email: seedAdmin.email },
		select: { id: true },
	});
	const created = !existing;
	if (created) {
		await auth.api.signUpEmail({
			body: {
				name: seedAdmin.name,
				email: seedAdmin.email,
				password: seedAdmin.password,
			},
		});
	}

	const admin = await prisma.user.update({
		where: { email: seedAdmin.email },
		data: { role: "ADMIN" },
		select: { id: true },
	});
	return { id: admin.id, created };
};

const getCategorySlug = async (name: string): Promise<string> => {
	const baseSlug = generateSlug(name);
	if (!baseSlug) {
		throw new Error(`Category name cannot produce a slug: ${name}`);
	}
	return findUniqueSlug(baseSlug, async (slug) => {
		const existing = await prisma.category.findUnique({ where: { slug }, select: { name: true } });
		return Boolean(existing && existing.name !== name);
	});
};

const seedCategories = async (categories: SeedData["categories"]) => {
	const counts = { created: 0, updated: 0 };
	for (const category of categories) {
		const slug = await getCategorySlug(category.name);
		const existing = await prisma.category.findUnique({ where: { slug }, select: { id: true } });
		await prisma.category.upsert({
			where: { slug },
			create: { name: category.name, slug },
			update: { name: category.name },
		});
		counts[existing ? "updated" : "created"] += 1;
	}
	return counts;
};

const getDestinationSlug = async (name: string): Promise<string> => {
	const baseSlug = generateSlug(name);
	if (!baseSlug) {
		throw new Error(`Destination name cannot produce a slug: ${name}`);
	}
	return findUniqueSlug(baseSlug, async (slug) => {
		const existing = await prisma.destination.findUnique({ where: { slug }, select: { name: true } });
		return Boolean(existing && existing.name !== name);
	});
};

const seedDestinations = async (destinations: SeedData["destinations"], createdById: string) => {
	const counts = { created: 0, updated: 0 };
	for (const destination of destinations) {
		const category = await prisma.category.findUnique({
			where: { name: destination.categoryName },
			select: { id: true },
		});
		if (!category) {
			throw new Error(`Destination "${destination.name}" references unknown category "${destination.categoryName}"`);
		}

		const slug = await getDestinationSlug(destination.name);
		const { categoryName: _categoryName, images, status, ...fields } = destination;
		const data = {
			...fields,
			slug,
			status: status ?? "DRAFT" as const,
			categoryId: category.id,
			createdById,
		};

		const result = await prisma.$transaction(async (transaction) => {
			const existing = await transaction.destination.findUnique({ where: { slug }, select: { id: true } });
			const saved = await transaction.destination.upsert({
				where: { slug },
				create: data,
				update: data,
				select: { id: true },
			});
			await transaction.destinationImage.deleteMany({ where: { destinationId: saved.id } });
			if (images?.length) {
				await transaction.destinationImage.createMany({
					data: images.map((image) => ({ destinationId: saved.id, ...image })),
				});
			}
			return existing ? "updated" as const : "created" as const;
		});
		counts[result] += 1;
	}
	return counts;
};

const main = async (): Promise<void> => {
	let exitCode = 0;
	try {
		const seedAdmin = getSeedAdmin();
		const seedData = await loadSeedData();
		const admin = await ensureAdmin(seedAdmin);
		const categoryCounts = await seedCategories(seedData.categories);
		const destinationCounts = await seedDestinations(seedData.destinations, admin.id);
		console.info(
			`Seed complete. Admin ${admin.created ? "created" : "already existed"}; `
			+ `categories ${categoryCounts.created} created/${categoryCounts.updated} updated; `
			+ `destinations ${destinationCounts.created} created/${destinationCounts.updated} updated.`,
		);
	} catch (error) {
		console.error("Seed failed:", error instanceof Error ? error.message : "Unknown error");
		exitCode = 1;
	} finally {
		try {
			await prisma.$disconnect();
		} catch {
			console.error("Seed failed to disconnect from the database");
			exitCode = 1;
		}
	}
	process.exitCode = exitCode;
};

void main();
