import {
	PutObjectCommand,
	type ObjectCannedACL
} from "@aws-sdk/client-s3";
import type { NextFunction, Request, RequestHandler, Response } from "express";
import path from "node:path";
import { getAwsConfig, getS3Client } from "../config";
import { createAppError } from "./errorHandler";
import { createUploader, type CreateUploaderOptions } from "./fileUpload";

export interface S3UploadResult {
	key: string;
	bucket: string;
	url: string;
	mimetype: string;
	size: number;
	originalName: string;
}

export interface S3UploadOptions extends Omit<CreateUploaderOptions, "storage"> {
	fieldName: string;
	keyPrefix?: string;
	acl?: ObjectCannedACL;
}

type RequestWithUpload = Request & {
	uploadedFile?: S3UploadResult;
	uploadedFiles?: S3UploadResult[];
};

const sanitizeFileName = (fileName: string): string =>
	fileName.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-").toLowerCase();

const buildObjectKey = (file: Express.Multer.File, keyPrefix = "uploads"): string => {
	const extension = path.extname(file.originalname);
	const baseName = path.basename(file.originalname, extension);
	const safeBaseName = sanitizeFileName(baseName) || "file";

	return `${keyPrefix}/${Date.now()}-${safeBaseName}${extension.toLowerCase()}`;
};

const buildObjectUrl = (bucket: string, region: string, key: string, endpoint?: string): string =>
	endpoint
		? `${endpoint.replace(/\/$/, "")}/${bucket}/${key}`
		: `https://${bucket}.s3.${region}.amazonaws.com/${key}`;

const uploadBufferToS3 = async (
	file: Express.Multer.File,
	options: Pick<S3UploadOptions, "keyPrefix" | "acl">
): Promise<S3UploadResult> => {
	const s3Client = getS3Client();
	const aws = getAwsConfig();
	const key = buildObjectKey(file, options.keyPrefix);

	await s3Client.send(
		new PutObjectCommand({
			Bucket: aws.s3Bucket,
			Key: key,
			Body: file.buffer,
			ContentType: file.mimetype,
			...(options.acl ? { ACL: options.acl } : {})
		})
	);

	return {
		key,
		bucket: aws.s3Bucket,
		url: buildObjectUrl(aws.s3Bucket, String(aws.region), key, String(aws.endpoint ?? "")),
		mimetype: file.mimetype,
		size: file.size,
		originalName: file.originalname
	};
};

export const uploadToS3 = (options: S3UploadOptions): RequestHandler => {
	const uploader = createUploader({
		...options,
		storage: undefined
	});

	return async (req: Request, res: Response, next: NextFunction) => {
		uploader.single(options.fieldName)(req, res, async (error?: unknown) => {
			if (error) {
				next(error);
				return;
			}

			try {
				if (!req.file) {
					throw createAppError(`File is required in field "${options.fieldName}".`, 400);
				}

				const uploadedFile = await uploadBufferToS3(req.file, options);
				(req as RequestWithUpload).uploadedFile = uploadedFile;
				next();
			} catch (uploadError) {
				next(uploadError);
			}
		});
	};
};

export const uploadManyToS3 = (
	fieldName: string,
	maxCount = 10,
	options: Omit<S3UploadOptions, "fieldName"> = {}
): RequestHandler => {
	const uploader = createUploader({
		...options,
		storage: undefined
	});

	return async (req: Request, res: Response, next: NextFunction) => {
		uploader.array(fieldName, maxCount)(req, res, async (error?: unknown) => {
			if (error) {
				next(error);
				return;
			}

			try {
				if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
					throw createAppError(`Files are required in field "${fieldName}".`, 400);
				}

				const uploadedFiles = await Promise.all(
					req.files.map((file) => uploadBufferToS3(file, options))
				);

				(req as RequestWithUpload).uploadedFiles = uploadedFiles;
				next();
			} catch (uploadError) {
				next(uploadError);
			}
		});
	};
};
