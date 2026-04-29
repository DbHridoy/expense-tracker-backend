import type { Request, RequestHandler } from "express";
import type { ZodTypeAny } from "zod";

export interface ValidationSchemas {
	body?: ZodTypeAny;
	query?: ZodTypeAny;
	params?: ZodTypeAny;
}

type MutableRequest = Request & {
	validated?: {
		body?: unknown;
		query?: unknown;
		params?: unknown;
	};
};

const assignValidated = (
	req: MutableRequest,
	key: keyof NonNullable<MutableRequest["validated"]>,
	value: unknown
): void => {
	req.validated = {
		...req.validated,
		[key]: value
	};
};

export const validate = (schemas: ValidationSchemas): RequestHandler => {
	return (req, _res, next) => {
		try {
			const mutableReq = req as MutableRequest;

			if (schemas.body) {
				const parsedBody = schemas.body.parse(req.body);
				req.body = parsedBody;
				assignValidated(mutableReq, "body", parsedBody);
			}

			if (schemas.query) {
				const parsedQuery = schemas.query.parse(req.query);
				req.query = parsedQuery as Request["query"];
				assignValidated(mutableReq, "query", parsedQuery);
			}

			if (schemas.params) {
				const parsedParams = schemas.params.parse(req.params);
				req.params = parsedParams as Request["params"];
				assignValidated(mutableReq, "params", parsedParams);
			}

			next();
		} catch (error) {
			next(error);
		}
	};
};

export const validateBody = (schema: ZodTypeAny): RequestHandler =>
	validate({ body: schema });

export const validateQuery = (schema: ZodTypeAny): RequestHandler =>
	validate({ query: schema });

export const validateParams = (schema: ZodTypeAny): RequestHandler =>
	validate({ params: schema });
