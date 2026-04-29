import type { RequestHandler } from "express";
import type { Field } from "multer";
import {
	createDiskStorage,
	createUploader,
	type CreateUploaderOptions
} from "./fileUpload";

export interface LocalUploadOptions extends CreateUploaderOptions {}

const createLocalUploader = (options: LocalUploadOptions = {}) =>
	createUploader({
		storage: createDiskStorage(options.destination),
		...options
	});

export const uploadLocalSingle = (
	fieldName: string,
	options: LocalUploadOptions = {}
): RequestHandler => createLocalUploader(options).single(fieldName);

export const uploadLocalArray = (
	fieldName: string,
	maxCount = 10,
	options: LocalUploadOptions = {}
): RequestHandler => createLocalUploader(options).array(fieldName, maxCount);

export const uploadLocalFields = (
	fields: Field[],
	options: LocalUploadOptions = {}
): RequestHandler => createLocalUploader(options).fields(fields);
