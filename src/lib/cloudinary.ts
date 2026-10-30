import { env } from "../config/env";

export const isCloudinaryImageUrl = (url: string): boolean => {
	const cloudName = env.CLOUDINARY_CLOUD_NAME;
	if (!cloudName) {
		return env.NODE_ENV === "development";
	}

	return url.startsWith(`https://res.cloudinary.com/${cloudName}/`);
};
