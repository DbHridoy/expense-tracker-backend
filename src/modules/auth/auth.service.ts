import { OAuth2Client } from "google-auth-library";
import type { JwtPayload } from "jsonwebtoken";
import {
	envConfig,
	getRequiredEnv
} from "../../config";
import { createAppError } from "../../middleware";
import {
	buildAuthCookies,
	clearAuthCookies,
	compareHash,
	hashValue,
	signAccessToken,
	signRefreshToken,
	verifyRefreshToken
} from "../../utils";
import type {
	GoogleAuthInput,
	LoginInput,
	RegisterInput
} from "./auth.validation";
import {
	type UserDocument,
	User
} from "./user.model";

export interface AuthTokenPayload {
	sub: string;
	email: string;
	role: string;
}

export interface AuthResponse {
	user: ReturnType<AuthService["serializeUser"]>;
	accessToken: string;
	refreshToken: string;
	cookies: ReturnType<typeof buildAuthCookies>;
}

export class AuthService {
	private readonly googleClient = new OAuth2Client();

	serializeUser(user: UserDocument) {
		return {
			id: user._id.toString(),
			name: user.name,
			email: user.email,
			role: user.role,
			avatar: user.avatar,
			authProvider: user.authProvider,
			isEmailVerified: user.isEmailVerified,
			lastLoginAt: user.lastLoginAt,
			createdAt: user.createdAt,
			updatedAt: user.updatedAt
		};
	}

	private buildTokenPayload(user: UserDocument): AuthTokenPayload {
		return {
			sub: user._id.toString(),
			email: user.email,
			role: user.role
		};
	}

	private async createSession(user: UserDocument): Promise<AuthResponse> {
		const payload = this.buildTokenPayload(user);
		const accessToken = signAccessToken(payload);
		const refreshToken = signRefreshToken(payload);
		const refreshTokenHash = await hashValue(refreshToken);

		user.refreshTokenHash = refreshTokenHash;
		user.lastLoginAt = new Date();
		await user.save();

		return {
			user: this.serializeUser(user),
			accessToken,
			refreshToken,
			cookies: buildAuthCookies({
				accessToken,
				refreshToken
			})
		};
	}

	async register(input: RegisterInput): Promise<AuthResponse> {
		const existingUser = await User.findOne({ email: input.email });

		if (existingUser) {
			throw createAppError("An account with this email already exists.", 409);
		}

		const hashedPassword = await hashValue(input.password);
		const user = await User.create({
			name: input.name,
			email: input.email,
			password: hashedPassword,
			authProvider: "local",
			isEmailVerified: false
		});

		return this.createSession(user);
	}

	async login(input: LoginInput): Promise<AuthResponse> {
		const user = await User.findOne({ email: input.email });

		if (!user || !user.password) {
			throw createAppError("Invalid email or password.", 401);
		}

		const isPasswordValid = await compareHash(input.password, user.password);

		if (!isPasswordValid) {
			throw createAppError("Invalid email or password.", 401);
		}

		return this.createSession(user);
	}

	async loginWithGoogle(input: GoogleAuthInput): Promise<AuthResponse> {
		const googleClientId = getRequiredEnv(
			"GOOGLE_CLIENT_ID",
			envConfig.getAll().google.clientId
		);
		const ticket = await this.googleClient.verifyIdToken({
			idToken: input.idToken,
			audience: googleClientId
		});
		const payload = ticket.getPayload();

		if (!payload?.email || !payload.sub) {
			throw createAppError("Google account payload is incomplete.", 400);
		}

		let user = await User.findOne({
			$or: [{ googleId: payload.sub }, { email: payload.email.toLowerCase() }]
		});

		if (!user) {
			user = await User.create({
				name: payload.name || payload.email.split("@")[0],
				email: payload.email.toLowerCase(),
				avatar: payload.picture || null,
				authProvider: "google",
				googleId: payload.sub,
				isEmailVerified: Boolean(payload.email_verified)
			});
		} else {
			user.googleId = payload.sub;
			user.authProvider = "google";
			user.avatar = payload.picture || user.avatar || null;
			user.isEmailVerified = Boolean(payload.email_verified) || user.isEmailVerified;
			if (payload.name && !user.name) {
				user.name = payload.name;
			}
			await user.save();
		}

		return this.createSession(user);
	}

	async refreshSession(refreshToken: string): Promise<AuthResponse> {
		const decoded = verifyRefreshToken(refreshToken);

		if (typeof decoded === "string" || !decoded.sub) {
			throw createAppError("Invalid refresh token.", 401);
		}

		const user = await User.findById(decoded.sub);

		if (!user || !user.refreshTokenHash) {
			throw createAppError("Refresh session not found.", 401);
		}

		const isTokenValid = await compareHash(refreshToken, user.refreshTokenHash);

		if (!isTokenValid) {
			throw createAppError("Refresh token mismatch.", 401);
		}

		return this.createSession(user);
	}

	async logout(userId?: string | null): Promise<ReturnType<typeof clearAuthCookies>> {
		if (userId) {
			await User.findByIdAndUpdate(userId, {
				$set: {
					refreshTokenHash: null
				}
			});
		}

		return clearAuthCookies();
	}

	async getCurrentUser(userId: string): Promise<ReturnType<AuthService["serializeUser"]>> {
		const user = await User.findById(userId);

		if (!user) {
			throw createAppError("User not found.", 404);
		}

		return this.serializeUser(user);
	}

	extractRefreshToken(
		cookieRefreshToken?: string,
		bodyRefreshToken?: string
	): string {
		const token = cookieRefreshToken || bodyRefreshToken || "";

		if (!token) {
			throw createAppError("Refresh token is required.", 401);
		}

		return token;
	}

	getRefreshPayload(token: string): JwtPayload {
		const payload = verifyRefreshToken(token);

		if (typeof payload === "string") {
			throw createAppError("Invalid refresh token payload.", 401);
		}

		return payload;
	}
}

export const authService = new AuthService();
