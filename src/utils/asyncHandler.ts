import type { NextFunction, Request, RequestHandler, Response } from "express";

export type AsyncRouteHandler = (
	req: Request,
	res: Response,
	next: NextFunction
) => Promise<unknown> | unknown;

export const asyncHandler = (handler: AsyncRouteHandler): RequestHandler => {
	if (typeof handler !== "function") {
		throw new TypeError("asyncHandler expects a function.");
	}

	return (req, res, next) => {
		Promise.resolve(handler(req, res, next)).catch(next);
	};
};
