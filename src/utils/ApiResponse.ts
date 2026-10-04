import type { Response } from "express";

interface SuccessOptions<TData, TMeta> {
	statusCode?: number;
	message: string;
	data: TData;
	meta?: TMeta;
}

export const sendSuccess = <TData, TMeta = unknown>(
	response: Response,
	{ statusCode = 200, message, data, meta }: SuccessOptions<TData, TMeta>,
): Response => {
	const payload = {
		success: true,
		message,
		data,
		...(meta === undefined ? {} : { meta }),
	};

	return response.status(statusCode).json(payload);
};
