import type { z } from "zod";
import type {
	createPackingItemSchema,
	createPackingItemsBulkSchema,
	packingListQuerySchema,
	updatePackingItemSchema,
} from "./packing.validation";

export type PackingListQuery = z.infer<typeof packingListQuerySchema>;
export type CreatePackingItemInput = z.infer<typeof createPackingItemSchema>;
export type CreatePackingItemsBulkInput = z.infer<typeof createPackingItemsBulkSchema>;
export type UpdatePackingItemInput = z.infer<typeof updatePackingItemSchema>;
