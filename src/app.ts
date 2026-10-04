import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { corsOptions } from "./config/cors";
import { errorHandler } from "./middlewares/errorHandler";
import { notFound } from "./middlewares/notFound";
import { generalLimiter } from "./middlewares/rateLimiter";
import { apiRouter } from "./routes";

const app = express();

app.use(helmet());
app.use(cors(corsOptions));
app.use(morgan("dev"));

// Mount the Better Auth handler here before express.json().
app.use("/api", generalLimiter);
app.use(express.json());
app.use("/api/v1", apiRouter);
app.use(notFound);
app.use(errorHandler);

export default app;
