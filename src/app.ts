import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { corsOptions } from "./config/cors";
import { authHandler } from "./lib/auth";
import { errorHandler } from "./middlewares/errorHandler";
import { notFound } from "./middlewares/notFound";
import { authLimiter, generalLimiter } from "./middlewares/rateLimiter";
import { apiRouter } from "./routes";

const app = express();

app.use(helmet());
app.use(cors(corsOptions));
app.use(morgan("dev"));
app.use("/api/auth", authLimiter);
app.all("/api/auth/*splat", authHandler);
app.use("/api", generalLimiter);
app.use(express.json());
app.use("/api/v1", apiRouter);
app.use(notFound);
app.use(errorHandler);

export default app;
