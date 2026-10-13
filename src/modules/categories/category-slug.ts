export const generateSlug = (value: string): string => value
	.toLowerCase()
	.trim()
	.replace(/\s+/g, "-")
	.replace(/[^\p{L}\p{N}-]/gu, "")
	.replace(/-+/g, "-")
	.replace(/^-|-$/g, "");

export const findUniqueSlug = async (
	baseSlug: string,
	isTaken: (slug: string) => Promise<boolean>,
): Promise<string> => {
	let candidate = baseSlug;
	let suffix = 2;
	while (await isTaken(candidate)) {
		candidate = `${baseSlug}-${suffix}`;
		suffix += 1;
	}
	return candidate;
};