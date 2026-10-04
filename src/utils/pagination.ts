const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

export interface Pagination {
	page: number;
	limit: number;
	skip: number;
}

export interface PaginationMeta {
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}

const positiveIntegerOrDefault = (value: unknown, fallback: number): number => {
	const parsed = typeof value === "number" ? value : Number(value);
	return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
};

export const getPagination = (query: {
	page?: unknown;
	limit?: unknown;
}): Pagination => {
	const page = positiveIntegerOrDefault(query.page, DEFAULT_PAGE);
	const requestedLimit = positiveIntegerOrDefault(query.limit, DEFAULT_LIMIT);
	const limit = Math.min(requestedLimit, MAX_LIMIT);

	return { page, limit, skip: (page - 1) * limit };
};

export const buildMeta = (
	total: number,
	page: number,
	limit: number,
): PaginationMeta => ({
	total,
	page,
	limit,
	totalPages: Math.ceil(total / limit),
});
