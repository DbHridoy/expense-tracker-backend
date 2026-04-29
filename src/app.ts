import cookieParser from "cookie-parser";
import cors, { type CorsOptions } from "cors";
import express, { type Express } from "express";
import path from "node:path";
import { env } from "./config";
import { errorHandler, notFoundMiddleware, requestLogger } from "./middleware";
import { authRouter } from "./modules/auth";

export const app: Express = express();

const corsOptions: CorsOptions = {
	origin: env.clientUrl === "*" ? true : env.clientUrl,
	credentials: true
};

app.disable("x-powered-by");
app.use(requestLogger);
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
	"/uploads",
	express.static(path.resolve(env.upload.destination), {
		fallthrough: true
	})
);

app.get("/health", (_req, res) => {
	res.status(200).json({
		success: true,
		message: "Server is running.",
		environment: env.nodeEnv
	});
});

app.use("/api/v1/auth", authRouter);

app.use(notFoundMiddleware);
app.use(errorHandler);
