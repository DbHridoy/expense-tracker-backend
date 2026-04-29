import fs from "node:fs";
import path from "node:path";
import multer, {
	type Field,
	type FileFilterCallback,
	type Multer,
	type StorageEngine
} from "multer";
import type { Request, RequestHandler } from "express";
import { envConfig, type EnvConfig } from "../config";

export interface CreateUploaderOptions {
	destination?: string;
	storage?: StorageEngine;
	allowedMimeTypes?: string[];
	fileSize?: number;
}

type MulterFileFilter = (
	req: Request,
	file: Express.Multer.File,
	callback: FileFilterCallback
) => void;

export class FileUploadMiddleware {
	constructor(private readonly config: EnvConfig = envConfig) {}

	ensureDirectory(directoryPath: string): void {
		fs.mkdirSync(directoryPath, { recursive: true });
	}

	createMemoryStorage(): StorageEngine {
		return multer.memoryStorage();
	}

	createDiskStorage(
		destination = this.config.getAll().upload.destination
	): StorageEngine {
		return multer.diskStorage({
			destination: (_req, _file, callback) => {
				const uploadPath = path.resolve(destination);
				this.ensureDirectory(uploadPath);
				callback(null, uploadPath);
			},
			filename: (_req, file, callback) => {
				const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
				const extension = path.extname(file.originalname);
				const baseName = path
					.basename(file.originalname, extension)
					.replace(/\s+/g, "-")
					.toLowerCase();

				callback(null, `${baseName}-${uniqueSuffix}${extension}`);
			}
		});
	}

	createFileFilter(allowedMimeTypes: string[] = []): MulterFileFilter {
		return (
			_req: Request,
			file: Express.Multer.File,
			callback: FileFilterCallback
		) => {
			if (allowedMimeTypes.length === 0) {
				return callback(null, true);
			}

			if (allowedMimeTypes.includes(file.mimetype)) {
				return callback(null, true);
			}

			return callback(new Error(`Unsupported file type: ${file.mimetype}`));
		};
	}

	createUploader(options: CreateUploaderOptions = {}): Multer {
		const maxFileSize = this.config.getAll().upload.maxFileSize;
		const {
			storage = this.createMemoryStorage(),
			allowedMimeTypes = [],
			fileSize = maxFileSize
		} = options;

		return multer({
			storage,
			fileFilter: this.createFileFilter(allowedMimeTypes),
			limits: {
				fileSize
			}
		});
	}

	single(
		fieldName: string,
		options: CreateUploaderOptions = {}
	): RequestHandler {
		return this.createUploader(options).single(fieldName);
	}

	array(
		fieldName: string,
		maxCount = 10,
		options: CreateUploaderOptions = {}
	): RequestHandler {
		return this.createUploader(options).array(fieldName, maxCount);
	}

	fields(fields: Field[], options: CreateUploaderOptions = {}): RequestHandler {
		return this.createUploader(options).fields(fields);
	}
}

export const fileUploadMiddleware = new FileUploadMiddleware();
export const createDiskStorage =
	fileUploadMiddleware.createDiskStorage.bind(fileUploadMiddleware);
export const createMemoryStorage =
	fileUploadMiddleware.createMemoryStorage.bind(fileUploadMiddleware);
export const createUploader =
	fileUploadMiddleware.createUploader.bind(fileUploadMiddleware);
export const uploadSingle: (
	fieldName: string,
	options?: CreateUploaderOptions
) => RequestHandler = fileUploadMiddleware.single.bind(fileUploadMiddleware);
export const uploadArray: (
	fieldName: string,
	maxCount?: number,
	options?: CreateUploaderOptions
) => RequestHandler = fileUploadMiddleware.array.bind(fileUploadMiddleware);
export const uploadFields: (
	fields: Field[],
	options?: CreateUploaderOptions
) => RequestHandler = fileUploadMiddleware.fields.bind(fileUploadMiddleware);
