import { ApiError } from "../../utils/ApiError";
import {
	countCategoryDestinations,
	createCategory as insertCategory,
	deleteCategory as removeCategory,
	findAllCategories,
	findCategoryById,
	findCategoryByName,
	findCategoryBySlug,
	updateCategory as saveCategory,
} from "./categories.repository";
import type { CategoryInput, CategoryView } from "./categories.types";

type CategoryRecord = Awaited<ReturnType<typeof findAllCategories>>[number];

const isPrismaError = (error: unknown, code: string): boolean =>
	typeof error === "object" && error !== null && "code" in error && error.code === code;

const toSlug = (value: string): string => value
	.toLowerCase()
	.trim()
	.replace(/\s+/g, "-")
	.replace(/[^\p{L}\p{N}-]/gu, "")
	.replace(/-+/g, "-")
	.replace(/^-|-$/g, "");

const uniqueSlug = async (name: string, excludeId?: string): Promise<string> => {
	const baseSlug = toSlug(name);
	if (!baseSlug) {
		throw ApiError.badRequest("Category name must contain letters or numbers");
	}

	let candidate = baseSlug;
	let suffix = 2;
	while (await findCategoryBySlug(candidate, excludeId)) {
		candidate = `${baseSlug}-${suffix}`;
		suffix += 1;
	}
	return candidate;
};

const mapCategory = (category: CategoryRecord): CategoryView => ({
	id: category.id,
	name: category.name,
	slug: category.slug,
	createdAt: category.createdAt,
	updatedAt: category.updatedAt,
});

export const categoriesService = {
	async listCategories(): Promise<CategoryView[]> {
		const categories = await findAllCategories();
		return categories.map(mapCategory);
	},

	async createCategory(input: CategoryInput): Promise<CategoryView> {
		if (await findCategoryByName(input.name)) {
			throw ApiError.conflict("A category with this name already exists");
		}

		const slug = await uniqueSlug(input.name);
		try {
			return mapCategory(await insertCategory({ name: input.name, slug }));
		} catch (error) {
			if (isPrismaError(error, "P2002")) {
				throw ApiError.conflict("A category with this name or slug already exists");
			}
			throw error;
		}
	},

	async updateCategory(id: string, input: CategoryInput): Promise<CategoryView> {
		if (!await findCategoryById(id)) {
			throw ApiError.notFound("Category not found");
		}
		if (await findCategoryByName(input.name, id)) {
			throw ApiError.conflict("A category with this name already exists");
		}

		const slug = await uniqueSlug(input.name, id);
		try {
			return mapCategory(await saveCategory(id, { name: input.name, slug }));
		} catch (error) {
			if (isPrismaError(error, "P2002")) {
				throw ApiError.conflict("A category with this name or slug already exists");
			}
			if (isPrismaError(error, "P2025")) {
				throw ApiError.notFound("Category not found");
			}
			throw error;
		}
	},

	async deleteCategory(id: string): Promise<void> {
		if (!await findCategoryById(id)) {
			throw ApiError.notFound("Category not found");
		}
		if (await countCategoryDestinations(id) > 0) {
			throw ApiError.conflict("Category is in use by one or more destinations");
		}

		try {
			await removeCategory(id);
		} catch (error) {
			if (isPrismaError(error, "P2003")) {
				throw ApiError.conflict("Category is in use by one or more destinations");
			}
			if (isPrismaError(error, "P2025")) {
				throw ApiError.notFound("Category not found");
			}
			throw error;
		}
	},
};