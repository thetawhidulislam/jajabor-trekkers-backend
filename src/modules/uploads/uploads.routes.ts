import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import { uploadSignatureLimiter } from "../../middlewares/rateLimiter";
import { validate } from "../../middlewares/validate";
import { uploadsController } from "./uploads.controller";
import { uploadSignatureSchema } from "./uploads.validation";

export const uploadsRouter = Router();

uploadsRouter.post(
	"/signature",
	uploadSignatureLimiter,
	authenticate,
	validate({ body: uploadSignatureSchema }),
	(request, response, next) => {
		const roles = request.body.folder === "destinations" ? ["ADMIN"] as const : ["USER", "ADMIN"] as const;
		return authorize([...roles])(request, response, next);
	},
	uploadsController.createSignature,
);
