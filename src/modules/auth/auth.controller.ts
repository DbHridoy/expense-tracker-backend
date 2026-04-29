import type { Request, RequestHandler, Response } from "express";
import { env } from "../../config";
import { createAppError } from "../../middleware";
import type { AuthCookieDefinition } from "../../utils";
import { asyncHandler } from "../../utils";
import { authService } from "./auth.service";

type RequestWithAuth = Request & {
	auth?: {
		sub?: string;
		email?: string;
		role?: string;
	};
};

const applyAuthCookies = (
	res: Response,
	cookies: AuthCookieDefinition[]
): void => {
	for (const cookie of cookies) {
		res.cookie(cookie.name, cookie.value, cookie.options);
	}
};

export const register: RequestHandler = asyncHandler(
	async (req: Request, res: Response) => {
	const result = await authService.register(req.body);
	applyAuthCookies(res, result.cookies);

	res.status(201).json({
		success: true,
		message: "Registration successful.",
		data: {
			user: result.user,
			accessToken: result.accessToken,
			refreshToken: result.refreshToken
		}
	});
	}
);

export const login: RequestHandler = asyncHandler(
	async (req: Request, res: Response) => {
	const result = await authService.login(req.body);
	applyAuthCookies(res, result.cookies);

	res.status(200).json({
		success: true,
		message: "Login successful.",
		data: {
			user: result.user,
			accessToken: result.accessToken,
			refreshToken: result.refreshToken
		}
	});
	}
);

export const googleLogin: RequestHandler = asyncHandler(
	async (req: Request, res: Response) => {
	const result = await authService.loginWithGoogle(req.body);
	applyAuthCookies(res, result.cookies);

	res.status(200).json({
		success: true,
		message: "Google authentication successful.",
		data: {
			user: result.user,
			accessToken: result.accessToken,
			refreshToken: result.refreshToken
		}
	});
	}
);

export const refresh: RequestHandler = asyncHandler(
	async (req: Request, res: Response) => {
	const refreshToken = authService.extractRefreshToken(
		typeof req.cookies?.[env.jwtRefreshCookieName] === "string"
			? req.cookies[env.jwtRefreshCookieName]
			: undefined,
		typeof req.body?.refreshToken === "string" ? req.body.refreshToken : undefined
	);
	const result = await authService.refreshSession(refreshToken);

	applyAuthCookies(res, result.cookies);

	res.status(200).json({
		success: true,
		message: "Session refreshed.",
		data: {
			user: result.user,
			accessToken: result.accessToken,
			refreshToken: result.refreshToken
		}
	});
	}
);

export const logout: RequestHandler = asyncHandler(
	async (req: Request, res: Response) => {
	const request = req as RequestWithAuth;
	const cookies = await authService.logout(request.auth?.sub ?? null);

	applyAuthCookies(res, cookies);

	res.status(200).json({
		success: true,
		message: "Logout successful."
	});
	}
);

export const getMe: RequestHandler = asyncHandler(
	async (req: Request, res: Response) => {
	const request = req as RequestWithAuth;
	const userId = request.auth?.sub;

	if (!userId) {
		throw createAppError("Authenticated user payload is missing.", 401);
	}

	const user = await authService.getCurrentUser(userId);

	res.status(200).json({
		success: true,
		data: {
			user
		}
	});
	}
);
