import type { NextFunction, Request, RequestHandler, Response } from "express";

export interface RequestLoggerOptions {
	includeHeaders?: boolean;
	skipPaths?: string[];
}

const buildLogPayload = (
	req: Request,
	res: Response,
	durationMs: number,
	includeHeaders: boolean
): Record<string, unknown> => ({
	method: req.method,
	path: req.originalUrl,
	statusCode: res.statusCode,
	durationMs,
	ip: req.ip,
	...(includeHeaders ? { headers: req.headers } : {})
});

export const createRequestLogger = (
	options: RequestLoggerOptions = {}
): RequestHandler => {
	const { includeHeaders = false, skipPaths = [] } = options;
	const ignoredPaths = new Set(skipPaths);

	return (req: Request, res: Response, next: NextFunction) => {
		if (ignoredPaths.has(req.path)) {
			return next();
		}

		const startedAt = process.hrtime.bigint();

		res.on("finish", () => {
			const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;

			console.log(
				JSON.stringify(
					buildLogPayload(req, res, Number(durationMs.toFixed(2)), includeHeaders)
				)
			);
		});

		next();
	};
};

export const requestLogger: RequestHandler = createRequestLogger({
	skipPaths: ["/health"]
});
