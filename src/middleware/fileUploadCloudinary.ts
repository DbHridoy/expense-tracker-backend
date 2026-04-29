import type { NextFunction, Request, RequestHandler, Response } from "express";
import { getCloudinaryClient, getCloudinaryConfig } from "../config";
import { createAppError } from "./errorHandler";
import { createUploader, type CreateUploaderOptions } from "./fileUpload";

export interface CloudinaryUploadResult {
	publicId: string;
	url: string;
	secureUrl: string;
	resourceType: string;
	bytes: number;
	format: string;
	originalName: string;
}

export interface CloudinaryUploadOptions
	extends Omit<CreateUploaderOptions, "storage"> {
	fieldName: string;
	folder?: string;
	resourceType?: "image" | "video" | "raw" | "auto";
}

type RequestWithUpload = Request & {
	uploadedFile?: CloudinaryUploadResult;
	uploadedFiles?: CloudinaryUploadResult[];
};

interface CloudinaryUploadApiResult {
	public_id: string;
	url: string;
	secure_url: string;
	resource_type: string;
	bytes: number;
	format: string;
}

const uploadBufferToCloudinary = (
	file: Express.Multer.File,
	options: Pick<CloudinaryUploadOptions, "folder" | "resourceType">
): Promise<CloudinaryUploadResult> => {
	const cloudinary = getCloudinaryClient();
	const config = getCloudinaryConfig();

	return new Promise((resolve, reject) => {
		const stream = cloudinary.uploader.upload_stream(
			{
				folder: options.folder ?? config.folder,
				resource_type: options.resourceType ?? "auto",
				filename_override: file.originalname,
				use_filename: true,
				unique_filename: true
			},
			(error, result) => {
				if (error) {
					reject(error);
					return;
				}

				if (!result) {
					reject(new Error("Cloudinary did not return an upload result."));
					return;
				}

				const uploadResult = result as CloudinaryUploadApiResult;

				resolve({
					publicId: uploadResult.public_id,
					url: uploadResult.url,
					secureUrl: uploadResult.secure_url,
					resourceType: uploadResult.resource_type,
					bytes: uploadResult.bytes,
					format: uploadResult.format,
					originalName: file.originalname
				});
			}
		);

		stream.end(file.buffer);
	});
};

export const uploadToCloudinary = (
	options: CloudinaryUploadOptions
): RequestHandler => {
	const uploader = createUploader(options);

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

				const uploadedFile = await uploadBufferToCloudinary(req.file, options);
				(req as RequestWithUpload).uploadedFile = uploadedFile;
				next();
			} catch (uploadError) {
				next(uploadError);
			}
		});
	};
};

export const uploadManyToCloudinary = (
	fieldName: string,
	maxCount = 10,
	options: Omit<CloudinaryUploadOptions, "fieldName"> = {}
): RequestHandler => {
	const uploader = createUploader(options);

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
					req.files.map((file) => uploadBufferToCloudinary(file, options))
				);

				(req as RequestWithUpload).uploadedFiles = uploadedFiles;
				next();
			} catch (uploadError) {
				next(uploadError);
			}
		});
	};
};
