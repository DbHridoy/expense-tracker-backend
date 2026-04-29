import { v2 as cloudinary } from "cloudinary";
import { envConfig, type EnvConfig } from "./env";

export interface ResolvedCloudinaryConfig {
	cloud_name: string;
	api_key: string;
	api_secret: string;
	folder: string;
}

export class CloudinaryConfig {
	private configured = false;

	constructor(private readonly config: EnvConfig = envConfig) {}

	getConfig(): ResolvedCloudinaryConfig {
		const env = this.config.getAll();

		return {
			cloud_name: this.config.getRequiredEnv(
				"CLOUDINARY_CLOUD_NAME",
				env.cloudinary.cloudName
			),
			api_key: this.config.getRequiredEnv(
				"CLOUDINARY_API_KEY",
				env.cloudinary.apiKey
			),
			api_secret: this.config.getRequiredEnv(
				"CLOUDINARY_API_SECRET",
				env.cloudinary.apiSecret
			),
			folder: env.cloudinary.folder
		};
	}

	getClient(): typeof cloudinary {
		if (!this.configured) {
			const { folder, ...clientConfig } = this.getConfig();
			void folder;
			cloudinary.config(clientConfig);
			this.configured = true;
		}

		return cloudinary;
	}
}

export const cloudinaryConfig = new CloudinaryConfig();
export const getCloudinaryConfig = cloudinaryConfig.getConfig.bind(cloudinaryConfig);
export const getCloudinaryClient = cloudinaryConfig.getClient.bind(cloudinaryConfig);
