import type { NextFunction, Request, RequestHandler, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { envConfig, type EnvConfig } from "../config";

type RequestWithDynamicAuth = Request & Record<string, unknown>;

export interface AuthTokenPayload extends JwtPayload {
	role?: string;
	[key: string]: unknown;
}

export interface AuthenticateOptions {
	secret?: string;
	roles?: string[];
	userProperty?: string;
	cookieName?: string;
}

export class AuthMiddleware {
	constructor(private readonly config: EnvConfig = envConfig) {}

	extractToken(req: Request, cookieName = this.config.getAll().jwtCookieName): string {
		const authorizationHeader = req.headers.authorization ?? "";
		const bearerToken = authorizationHeader.startsWith("Bearer ")
			? authorizationHeader.slice(7).trim()
			: "";
		const cookieToken =
			typeof req.cookies?.[cookieName] === "string" ? req.cookies[cookieName] : "";

		return bearerToken || cookieToken || "";
	}

	private assignAuth(
		req: RequestWithDynamicAuth,
		userProperty: string,
		value: unknown
	): void {
		req[userProperty] = value;
	}

	authenticate(options: AuthenticateOptions = {}): RequestHandler {
		const env = this.config.getAll();
		const {
			secret = env.jwtSecret,
			roles = [],
			userProperty = "auth",
			cookieName = env.jwtCookieName
		} = options;

		return (req: Request, res: Response, next: NextFunction) => {
			try {
				const token = this.extractToken(req, cookieName);

				if (!token) {
					return res.status(401).json({
						success: false,
						message: "Authentication token is required."
					});
				}

				if (!secret) {
					return res.status(500).json({
						success: false,
						message: "JWT secret is not configured."
					});
				}

				const decoded = jwt.verify(token, secret) as AuthTokenPayload | string;
				this.assignAuth(req as RequestWithDynamicAuth, userProperty, decoded);

				const role = typeof decoded === "string" ? undefined : decoded.role;

				if (roles.length > 0 && (!role || !roles.includes(role))) {
					return res.status(403).json({
						success: false,
						message: "You do not have permission to access this resource."
					});
				}

				return next();
			} catch (error) {
				const message =
					error instanceof Error ? error.message : "Authentication failed.";

				return res.status(401).json({
					success: false,
					message: "Invalid or expired authentication token.",
					error: message
				});
			}
		};
	}

	optional(options: Omit<AuthenticateOptions, "roles"> = {}): RequestHandler {
		const env = this.config.getAll();
		const {
			secret = env.jwtSecret,
			userProperty = "auth",
			cookieName = env.jwtCookieName
		} = options;

		return (req: Request, _res: Response, next: NextFunction) => {
			try {
				const token = this.extractToken(req, cookieName);

				if (token && secret) {
					const decoded = jwt.verify(token, secret) as AuthTokenPayload | string;
					this.assignAuth(req as RequestWithDynamicAuth, userProperty, decoded);
				}
			} catch {
				this.assignAuth(req as RequestWithDynamicAuth, userProperty, null);
			}

			return next();
		};
	}

	authorizeRoles(...roles: string[]): RequestHandler {
		return this.authenticate({ roles });
	}
}

export const authMiddleware = new AuthMiddleware();
export const extractToken = authMiddleware.extractToken.bind(authMiddleware);
export const buildAuthMiddleware = authMiddleware.authenticate.bind(authMiddleware);
export const optionalAuth = authMiddleware.optional.bind(authMiddleware);
export const requireRoles = authMiddleware.authorizeRoles.bind(authMiddleware);
