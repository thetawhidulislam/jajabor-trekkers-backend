export interface CategoryView {
	id: string;
	name: string;
	slug: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface CategoryInput {
	name: string;
}