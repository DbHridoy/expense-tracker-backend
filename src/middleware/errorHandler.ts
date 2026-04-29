import type { ErrorRequestHandler, RequestHandler } from "express";
import { MulterError } from "multer";
import mongoose from "mongoose";
import { ZodError } from "zod";
import { env } from "../config";

export class AppError extends Error {
	constructor(
		message: string,
		public readonly statusCode = 500,
		public readonly details?: unknown
	) {
		super(message);
		this.name = "AppError";
	}
}

export const createAppError = (
	message: string,
	statusCode = 500,
	details?: unknown
): AppError => new AppError(message, statusCode, details);

const getStatusCode = (error: unknown): number => {
	if (error instanceof AppError) {
		return error.statusCode;
	}

	if (error instanceof ZodError) {
		return 400;
	}

	if (error instanceof MulterError) {
		return 400;
	}

	if (
		error instanceof mongoose.Error.ValidationError ||
		error instanceof mongoose.Error.CastError
	) {
		return 400;
	}

	if (error instanceof mongoose.mongo.MongoServerError && error.code === 11000) {
		return 409;
	}

	if (
		typeof error === "object" &&
		error !== null &&
		"statusCode" in error &&
		typeof error.statusCode === "number"
	) {
		return error.statusCode;
	}

	return 500;
};

const getErrorMessage = (error: unknown): string => {
	if (error instanceof ZodError) {
		return "Validation failed.";
	}

	if (error instanceof MulterError) {
		return error.message;
	}

	if (error instanceof mongoose.Error.ValidationError) {
		return "Database validation failed.";
	}

	if (error instanceof mongoose.Error.CastError) {
		return `Invalid value for ${error.path}.`;
	}

	if (error instanceof mongoose.mongo.MongoServerError && error.code === 11000) {
		return "A record with the same unique value already exists.";
	}

	if (error instanceof Error && error.message) {
		return error.message;
	}

	return "Internal server error.";
};

const getErrorDetails = (error: unknown): unknown => {
	if (error instanceof AppError) {
		return error.details;
	}

	if (error instanceof ZodError) {
		return error.flatten();
	}

	if (error instanceof mongoose.Error.ValidationError) {
		return Object.values(error.errors).map((issue) => ({
			path: issue.path,
			message: issue.message
		}));
	}

	if (error instanceof mongoose.mongo.MongoServerError && error.code === 11000) {
		return error.keyValue;
	}

	return undefined;
};

export const notFoundMiddleware: RequestHandler = (req, _res, next) => {
	next(createAppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
};

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
	const statusCode = getStatusCode(error);
	const message = getErrorMessage(error);
	const details = getErrorDetails(error);

	res.status(statusCode).json({
		success: false,
		message,
		...(details !== undefined ? { details } : {}),
		...(env.nodeEnv !== "production" && error instanceof Error
			? { stack: error.stack }
			: {})
	});
};
