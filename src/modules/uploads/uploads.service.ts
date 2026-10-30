import { v2 as cloudinary } from "cloudinary";
import { env } from "../../config/env";
import { ApiError } from "../../utils/ApiError";
import type { UploadFolder } from "./uploads.validation";

export const uploadsService = {
	createSignature(folder: UploadFolder) {
		const { CLOUDINARY_CLOUD_NAME: cloudName, CLOUDINARY_API_KEY: apiKey, CLOUDINARY_API_SECRET: apiSecret } = env;
		if (!cloudName || !apiKey || !apiSecret) {
			throw new ApiError(503, "Image upload is not configured");
		}

		const timestamp = Math.floor(Date.now() / 1000);
		const cloudinaryFolder = `jajabor/${folder}`;
		const signature = cloudinary.utils.api_sign_request(
			{ folder: cloudinaryFolder, timestamp },
			apiSecret,
		);

		return {
			cloudName,
			apiKey,
			timestamp,
			folder: cloudinaryFolder,
			signature,
		};
	},
};
