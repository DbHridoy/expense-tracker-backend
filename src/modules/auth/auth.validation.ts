import { z } from "zod";

export const registerSchema = z.object({
	name: z.string().trim().min(2).max(80),
	email: z.email().trim().toLowerCase(),
	password: z.string().min(8).max(128)
});

export const loginSchema = z.object({
	email: z.email().trim().toLowerCase(),
	password: z.string().min(1).max(128)
});

export const googleAuthSchema = z.object({
	idToken: z.string().min(1)
});

export const refreshTokenSchema = z.object({
	refreshToken: z.string().min(1).optional()
});

export const authIdParamSchema = z.object({
	id: z.string().min(1)
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type GoogleAuthInput = z.infer<typeof googleAuthSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
