import { z } from "zod";
import { uploadSignatureSchema } from "../modules/uploads/uploads.validation";
import { authenticationDetails, errorResponse, errorResponses, registry } from "./registry";

const uploadSignatureDataSchema = z.object({
	cloudName: z.string(),
	apiKey: z.string(),
	timestamp: z.number().int(),
	folder: z.string(),
	signature: z.string(),
});

registry.registerPath({
	method: "post",
	path: "/api/v1/uploads/signature",
	tags: ["Uploads"],
	summary: "Create a Cloudinary direct-upload signature",
	...authenticationDetails("user"),
	request: {
		body: { content: { "application/json": { schema: uploadSignatureSchema } } },
	},
	responses: {
		200: {
			description: "Signature and public Cloudinary upload parameters.",
			content: {
				"application/json": {
					schema: z.object({
						success: z.literal(true),
						message: z.string(),
						data: uploadSignatureDataSchema,
					}),
				},
			},
		},
		...errorResponses(400, 401, 403, 429),
		503: errorResponse("Image upload is not configured."),
	},
});
