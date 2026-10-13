import type { Prisma } from "../../generated/prisma";
import { ApiError } from "../../utils/ApiError";
import { buildMeta, getPagination } from "../../utils/pagination";
import {
	categoryExists,
	createDestinationWithImages,
	deleteDestination as removeDestination,
	findDestinationById,
	findDestinationBySlug,
	findDestinationBySlugValue,
	findDestinations,
	updateDestination,
	updateDestinationWithImages,
} from "./destinations.repository";
import type { DestinationRecord } from "./destinations.repository";
import type {
	AdminDestinationListQuery,
	CreateDestinationInput,
	DestinationListQuery,
	DestinationSort,
	DestinationStatusValue,
	UpdateDestinationFeaturedInput,
	UpdateDestinationInput,
	UpdateDestinationStatusInput,
} from "./destinations.types";

const isPrismaError = (error: unknown, code: string): boolean =>
	typeof error === "object" && error !== null && "code" in error && error.code === code;

const toSlug = (value: string): string => value
	.toLowerCase()
	.trim()
	.replace(/\s+/g, "-")
	.replace(/[^\p{L}\p{N}-]/gu, "")
	.replace(/-+/g, "-")
	.replace(/^-|-$/g, "");

const uniqueSlug = async (value: string, excludeId?: string): Promise<string> => {
	const baseSlug = toSlug(value);
	if (!baseSlug) {
		throw ApiError.badRequest("Destination slug must contain letters or numbers");
	}

	let candidate = baseSlug;
	let suffix = 2;
	while (await findDestinationBySlugValue(candidate, excludeId)) {
		candidate = `${baseSlug}-${suffix}`;
		suffix += 1;
	}
	return candidate;
};

const buildWhere = (
	query: DestinationListQuery,
	status?: DestinationStatusValue,
): Prisma.DestinationWhereInput => ({
	...(status ? { status } : {}),
	...(query.search ? {
		OR: [
			{ name: { contains: query.search, mode: "insensitive" } },
			{ district: { contains: query.search, mode: "insensitive" } },
			{ division: { contains: query.search, mode: "insensitive" } },
		],
	} : {}),
	...(query.division ? { division: { equals: query.division, mode: "insensitive" } } : {}),
	...(query.category ? { category: { is: { slug: query.category } } } : {}),
	...(query.difficulty ? { difficulty: query.difficulty } : {}),
	...(query.minCost !== undefined ? { estimatedCostMax: { gte: query.minCost } } : {}),
	...(query.maxCost !== undefined ? { estimatedCostMin: { lte: query.maxCost } } : {}),
	...(query.featured !== undefined ? { isFeatured: query.featured } : {}),
});

const orderByFor = (sort: DestinationSort): Prisma.DestinationOrderByWithRelationInput[] => {
	switch (sort) {
		case "rating":
			return [{ avgRating: "desc" }, { reviewCount: "desc" }, { createdAt: "desc" }];
		case "cost_asc":
			return [{ estimatedCostMin: "asc" }, { createdAt: "desc" }];
		case "cost_desc":
			return [{ estimatedCostMin: "desc" }, { createdAt: "desc" }];
		case "newest":
			return [{ createdAt: "desc" }];
	}
};

const mapDestination = (
	destination: DestinationRecord,
	options: { card?: boolean; includeCreatedById?: boolean; includeStatus?: boolean } = {},
) => {
	const base = {
		id: destination.id,
		slug: destination.slug,
		name: destination.name,
		division: destination.division,
		district: destination.district,
		locationText: destination.locationText,
		latitude: destination.latitude,
		longitude: destination.longitude,
		description: destination.description,
		coverImage: destination.coverImage,
		estimatedCostMin: Number(destination.estimatedCostMin),
		estimatedCostMax: Number(destination.estimatedCostMax),
		recommendedDays: destination.recommendedDays,
		bestTimeToVisit: destination.bestTimeToVisit,
		activities: destination.activities,
		difficulty: destination.difficulty,
		safetyNotes: destination.safetyNotes,
		permissionRequired: destination.permissionRequired,
		permissionNote: destination.permissionNote,
		lastVerifiedAt: destination.lastVerifiedAt,
		status: destination.status,
		isFeatured: destination.isFeatured,
		avgRating: destination.avgRating,
		reviewCount: destination.reviewCount,
		categoryId: destination.categoryId,
		createdAt: destination.createdAt,
		updatedAt: destination.updatedAt,
		category: destination.category,
		...(options.includeCreatedById ? { createdById: destination.createdById } : {}),
		...( "images" in destination
			? { images: destination.images.map((image) => ({
				id: image.id,
				url: image.url,
				caption: image.caption,
				sortOrder: image.sortOrder,
				createdAt: image.createdAt,
				updatedAt: image.updatedAt,
			})) }
			: {}),
	};

	if (options.card) {
		return {
			id: base.id,
			slug: base.slug,
			name: base.name,
			division: base.division,
			district: base.district,
			coverImage: base.coverImage,
			estimatedCostMin: base.estimatedCostMin,
			estimatedCostMax: base.estimatedCostMax,
			recommendedDays: base.recommendedDays,
			difficulty: base.difficulty,
			avgRating: base.avgRating,
			reviewCount: base.reviewCount,
			isFeatured: base.isFeatured,
			category: base.category,
			...(options.includeStatus ? { status: base.status } : {}),
		};
	}
	return base;
};

const ensureCategoryExists = async (categoryId: string): Promise<void> => {
	if (!await categoryExists(categoryId)) {
		throw ApiError.notFound("Category not found");
	}
};

const mapWriteError = (error: unknown): never => {
	if (isPrismaError(error, "P2002")) {
		throw ApiError.conflict("A destination with this slug already exists");
	}
	if (isPrismaError(error, "P2003")) {
		throw ApiError.notFound("Category not found");
	}
	if (isPrismaError(error, "P2025")) {
		throw ApiError.notFound("Destination not found");
	}
	throw error;
};

const paginatedDestinations = async (
	query: DestinationListQuery,
	status?: DestinationStatusValue,
	includeStatus = false,
) => {
	const pagination = getPagination({ page: query.page, limit: query.limit });
	const result = await findDestinations({
		where: buildWhere(query, status),
		orderBy: orderByFor(query.sort),
		skip: pagination.skip,
		take: pagination.limit,
	});
	return {
		destinations: result.destinations.map((destination) => mapDestination(destination, {
			card: true,
			includeStatus,
		})),
		meta: buildMeta(result.total, pagination.page, pagination.limit),
	};
};

export const destinationsService = {
	async listPublicDestinations(query: DestinationListQuery) {
		return paginatedDestinations(query, "PUBLISHED");
	},

	async getPublicDestination(slug: string) {
		const destination = await findDestinationBySlug(slug, true);
		if (!destination) {
			throw ApiError.notFound("Destination not found");
		}
		return mapDestination(destination);
	},

	async listAdminDestinations(query: AdminDestinationListQuery) {
		return paginatedDestinations(query, query.status, true);
	},

	async getAdminDestination(id: string) {
		const destination = await findDestinationById(id);
		if (!destination) {
			throw ApiError.notFound("Destination not found");
		}
		return mapDestination(destination, { includeCreatedById: true });
	},

	async createDestination(input: CreateDestinationInput, createdById: string) {
		await ensureCategoryExists(input.categoryId);
		const { images, ...fields } = input;
		const slug = await uniqueSlug(input.name);
		try {
			const destination = await createDestinationWithImages({
				...fields,
				slug,
				status: "DRAFT",
				isFeatured: false,
				createdById,
			}, { ...input, images });
			return mapDestination(destination, { includeCreatedById: true });
		} catch (error) {
			return mapWriteError(error);
		}
	},

	async updateAdminDestination(id: string, input: UpdateDestinationInput) {
		const current = await findDestinationById(id);
		if (!current) {
			throw ApiError.notFound("Destination not found");
		}
		if (input.categoryId) {
			await ensureCategoryExists(input.categoryId);
		}

		const nextMin = input.estimatedCostMin ?? Number(current.estimatedCostMin);
		const nextMax = input.estimatedCostMax ?? Number(current.estimatedCostMax);
		if (nextMin > nextMax) {
			throw ApiError.badRequest("estimatedCostMin must be less than or equal to estimatedCostMax");
		}
		const permissionRequired = input.permissionRequired ?? current.permissionRequired;
		const permissionNote = input.permissionNote !== undefined ? input.permissionNote : current.permissionNote;
		if (permissionRequired && !permissionNote?.trim()) {
			throw ApiError.badRequest("permissionNote is required when permissionRequired is true");
		}

		const { images, slug: requestedSlug, ...fields } = input;
		const data: Prisma.DestinationUncheckedUpdateInput = {
			...fields,
			...(requestedSlug === undefined ? {} : { slug: await uniqueSlug(requestedSlug, id) }),
		};
		try {
			const destination = await updateDestinationWithImages(id, data, images);
			return mapDestination(destination, { includeCreatedById: true });
		} catch (error) {
			return mapWriteError(error);
		}
	},

	async updateAdminDestinationStatus(id: string, input: UpdateDestinationStatusInput) {
		const current = await findDestinationById(id);
		if (!current) {
			throw ApiError.notFound("Destination not found");
		}

		if (input.status === "PUBLISHED") {
			const missing: string[] = [];
			if (!current.coverImage) missing.push("coverImage");
			if (!current.description) missing.push("description");
			if (current.estimatedCostMin === null || current.estimatedCostMax === null) missing.push("cost range");
			if (!current.difficulty) missing.push("difficulty");
			if (!current.categoryId || !current.category) missing.push("categoryId");
			if (missing.length) {
				throw ApiError.badRequest(`Cannot publish destination. Missing required fields: ${missing.join(", ")}`);
			}
		}

		try {
			const data: Prisma.DestinationUncheckedUpdateInput = {
				status: input.status,
				...(input.status === "PUBLISHED" ? {} : { isFeatured: false }),
			};
			const destination = await updateDestination(id, data);
			return mapDestination(destination, { includeCreatedById: true });
		} catch (error) {
			return mapWriteError(error);
		}
	},

	async updateAdminDestinationFeatured(id: string, input: UpdateDestinationFeaturedInput) {
		const current = await findDestinationById(id);
		if (!current) {
			throw ApiError.notFound("Destination not found");
		}
		if (current.status !== "PUBLISHED") {
			throw ApiError.badRequest("Only published destinations can be featured");
		}

		try {
			const destination = await updateDestination(id, { isFeatured: input.isFeatured });
			return mapDestination(destination, { includeCreatedById: true });
		} catch (error) {
			return mapWriteError(error);
		}
	},

	async deleteAdminDestination(id: string): Promise<void> {
		const current = await findDestinationById(id);
		if (!current) {
			throw ApiError.notFound("Destination not found");
		}
		if (current.status !== "DRAFT") {
			throw ApiError.conflict("Archive it instead");
		}
		try {
			await removeDestination(id);
		} catch (error) {
			return mapWriteError(error);
		}
	},
};
