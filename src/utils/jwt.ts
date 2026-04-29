import type { CookieOptions } from "express";
import jwt, { type JwtPayload, type SignOptions, type Secret } from "jsonwebtoken";
import { envConfig } from "../config";

export interface JwtDefaults {
	accessSecret: string;
	refreshSecret: string;
	accessExpiresIn: SignOptions["expiresIn"];
	refreshExpiresIn: SignOptions["expiresIn"];
	accessCookieName: string;
	refreshCookieName: string;
}

export interface JwtSignOverrides {
	secret?: Secret;
	expiresIn?: SignOptions["expiresIn"];
}

export interface AuthCookiesInput {
	accessToken?: string;
	refreshToken?: string;
}

export interface BuildAuthCookiesOptions {
	base?: CookieOptions;
	accessMaxAge?: number;
	refreshMaxAge?: number;
}

export interface AuthCookieDefinition {
	name: string;
	value: string;
	options: CookieOptions;
}

export const getJwtDefaults = (): JwtDefaults => {
	const env = envConfig.getAll();

	return {
		accessSecret: env.jwtSecret,
		refreshSecret: env.jwtRefreshSecret || env.jwtSecret,
		accessExpiresIn: env.jwtExpiresIn as SignOptions["expiresIn"],
		refreshExpiresIn: env.jwtRefreshExpiresIn as SignOptions["expiresIn"],
		accessCookieName: env.jwtCookieName,
		refreshCookieName: env.jwtRefreshCookieName
	};
};

export const signAccessToken = (
	payload: string | Buffer | object,
	options: JwtSignOverrides = {}
): string => {
	const defaults = getJwtDefaults();
	const secret = options.secret || defaults.accessSecret;

	if (!secret) {
		throw new Error("JWT secret is not configured.");
	}

	return jwt.sign(payload, secret, {
		expiresIn: options.expiresIn || defaults.accessExpiresIn
	});
};

export const signRefreshToken = (
	payload: string | Buffer | object,
	options: JwtSignOverrides = {}
): string => {
	const defaults = getJwtDefaults();
	const secret = options.secret || defaults.refreshSecret;

	if (!secret) {
		throw new Error("JWT refresh secret is not configured.");
	}

	return jwt.sign(payload, secret, {
		expiresIn: options.expiresIn || defaults.refreshExpiresIn
	});
};

export const verifyAccessToken = (
	token: string,
	options: { secret?: Secret } = {}
): string | JwtPayload => {
	const defaults = getJwtDefaults();
	return jwt.verify(token, options.secret || defaults.accessSecret);
};

export const verifyRefreshToken = (
	token: string,
	options: { secret?: Secret } = {}
): string | JwtPayload => {
	const defaults = getJwtDefaults();
	return jwt.verify(token, options.secret || defaults.refreshSecret);
};

export const buildAuthCookies = (
	tokens: AuthCookiesInput,
	options: BuildAuthCookiesOptions = {}
): AuthCookieDefinition[] => {
	const defaults = getJwtDefaults();
	const baseCookieOptions: CookieOptions = {
		httpOnly: true,
		sameSite: "lax",
		secure: envConfig.getAll().nodeEnv === "production",
		...options.base
	};

	const cookies: AuthCookieDefinition[] = [];

	if (tokens.accessToken) {
		cookies.push({
			name: defaults.accessCookieName,
			value: tokens.accessToken,
			options: {
				...baseCookieOptions,
				maxAge: options.accessMaxAge
			}
		});
	}

	if (tokens.refreshToken) {
		cookies.push({
			name: defaults.refreshCookieName,
			value: tokens.refreshToken,
			options: {
				...baseCookieOptions,
				maxAge: options.refreshMaxAge
			}
		});
	}

	return cookies;
};

export const clearAuthCookies = (
	options: Omit<BuildAuthCookiesOptions, "accessMaxAge" | "refreshMaxAge"> = {}
): AuthCookieDefinition[] => {
	return buildAuthCookies(
		{
			accessToken: "",
			refreshToken: ""
		},
		{
			...options,
			accessMaxAge: 0,
			refreshMaxAge: 0
		}
	);
};
