import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { corsOptions } from "./config/cors";
import { apiRouter } from "./routes";

const app = express();

app.use(helmet());
app.use(cors(corsOptions));
app.use(morgan("dev"));

// Mount the Better Auth handler here before express.json().
app.use(express.json());
app.use("/api/v1", apiRouter);

export default app;
