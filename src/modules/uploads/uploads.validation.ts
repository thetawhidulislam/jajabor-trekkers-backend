import { z } from "zod";

export const uploadSignatureSchema = z.object({
	folder: z.enum(["destinations", "avatars"]),
}).strict();

export type UploadFolder = z.infer<typeof uploadSignatureSchema>["folder"];
