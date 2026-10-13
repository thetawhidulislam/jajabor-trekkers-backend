import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { corsOptions } from "./config/cors";
import { env } from "./config/env";
import { openApiDocument } from "./docs/openapi";
import { authHandler } from "./lib/auth";
import { errorHandler } from "./middlewares/errorHandler";
import { notFound } from "./middlewares/notFound";
import { authLimiter, generalLimiter } from "./middlewares/rateLimiter";
import { apiRouter } from "./routes";
import swaggerUi from "swagger-ui-express";

const app = express();

app.use(helmet());
app.use(cors(corsOptions));
app.use(morgan("dev"));
app.use("/api/auth", authLimiter);
app.all("/api/auth/*splat", authHandler);
app.use("/api", generalLimiter);
app.use(express.json());
app.use("/api/v1", apiRouter);
if (env.NODE_ENV !== "production") {
	app.use("/api/docs", helmet({
		contentSecurityPolicy: {
			directives: {
				defaultSrc: ["'self'"],
				scriptSrc: ["'self'", "'unsafe-inline'"],
				styleSrc: ["'self'", "'unsafe-inline'"],
				imgSrc: ["'self'", "data:"],
				connectSrc: ["'self'"],
			},
		},
	}));
	app.get("/api/docs.json", (_request, response) => response.json(openApiDocument));
	app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));
}
app.use(notFound);
app.use(errorHandler);

export default app;
