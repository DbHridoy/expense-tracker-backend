import { Router, type Router as ExpressRouter } from "express";
import {
	buildAuthMiddleware,
	validate,
	validateBody
} from "../../middleware";
import {
	getMe,
	googleLogin,
	login,
	logout,
	refresh,
	register
} from "./auth.controller";
import {
	googleAuthSchema,
	loginSchema,
	refreshTokenSchema,
	registerSchema
} from "./auth.validation";

export const authRouter: ExpressRouter = Router();

authRouter.post("/register", validateBody(registerSchema), register);
authRouter.post("/login", validateBody(loginSchema), login);
authRouter.post("/google", validateBody(googleAuthSchema), googleLogin);
authRouter.post("/refresh", validate({ body: refreshTokenSchema }), refresh);
authRouter.post("/logout", buildAuthMiddleware(), logout);
authRouter.get("/me", buildAuthMiddleware(), getMe);
