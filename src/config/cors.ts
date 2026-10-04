import cors from "cors";
import { env } from "./env";

export const corsOptions: cors.CorsOptions = {
	origin: env.CLIENT_URL,
	credentials: true,
};
