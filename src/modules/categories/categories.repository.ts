import type { Prisma } from "../../generated/prisma";
import { prisma } from "../../lib/prisma";

const categorySelect = {
	id: true,
	name: true,
	slug: true,
	createdAt: true,
	updatedAt: true,
} satisfies Prisma.CategorySelect;

export const findAllCategories = async () => prisma.category.findMany({
	select: categorySelect,
	orderBy: { name: "asc" },
});

export const findCategoryById = async (id: string) => prisma.category.findUnique({
	where: { id },
	select: categorySelect,
});

export const findCategoryByName = async (name: string, excludeId?: string) => prisma.category.findFirst({
	where: {
		name,
		...(excludeId ? { id: { not: excludeId } } : {}),
	},
	select: categorySelect,
});

export const findCategoryBySlug = async (slug: string, excludeId?: string) => prisma.category.findFirst({
	where: {
		slug,
		...(excludeId ? { id: { not: excludeId } } : {}),
	},
	select: categorySelect,
});

export const createCategory = async (data: { name: string; slug: string }) => prisma.category.create({
	data,
	select: categorySelect,
});

export const updateCategory = async (id: string, data: { name: string; slug: string }) => prisma.category.update({
	where: { id },
	data,
	select: categorySelect,
});

export const countCategoryDestinations = async (categoryId: string): Promise<number> =>
	prisma.destination.count({ where: { categoryId } });

export const deleteCategory = async (id: string): Promise<void> => {
	await prisma.category.delete({ where: { id } });
};