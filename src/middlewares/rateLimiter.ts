import { rateLimit } from "express-rate-limit";

const rateLimitHandler = (_request: unknown, response: import("express").Response): void => {
	response.status(429).json({
		success: false,
		message: "Too many requests, please try again later",
	});
};

export const generalLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	limit: 100,
	standardHeaders: "draft-8",
	legacyHeaders: false,
	handler: rateLimitHandler,
});

export const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	limit: 10,
	standardHeaders: "draft-8",
	legacyHeaders: false,
	handler: rateLimitHandler,
});
