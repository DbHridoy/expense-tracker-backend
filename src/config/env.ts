import dotenv from "dotenv";

export interface EmailEnvConfig {
	host: string;
	port: number;
	secure: boolean;
	user: string;
	pass: string;
	fromName: string;
	fromAddress: string;
}

export interface AwsEnvConfig {
	region: string;
	accessKeyId: string;
	secretAccessKey: string;
	s3Bucket: string;
	s3Endpoint: string;
}

export interface CloudinaryEnvConfig {
	cloudName: string;
	apiKey: string;
	apiSecret: string;
	folder: string;
}

export interface UploadEnvConfig {
	maxFileSize: number;
	destination: string;
}

export interface SocketEnvConfig {
	path: string;
	transports: string[];
}

export interface GoogleEnvConfig {
	clientId: string;
}

export interface AppEnv {
	nodeEnv: string;
	port: number;
	clientUrl: string;
	apiBaseUrl: string;
	databaseUri: string;
	jwtSecret: string;
	jwtRefreshSecret: string;
	jwtExpiresIn: string;
	jwtRefreshExpiresIn: string;
	jwtCookieName: string;
	jwtRefreshCookieName: string;
	bcryptSaltRounds: number;
	socket: SocketEnvConfig;
	google: GoogleEnvConfig;
	email: EmailEnvConfig;
	aws: AwsEnvConfig;
	cloudinary: CloudinaryEnvConfig;
	upload: UploadEnvConfig;
}

export class EnvConfig {
	private values: AppEnv;

	constructor() {
		dotenv.config();
		this.values = this.load();
	}

	private readString(name: string, fallback = ""): string {
		const value = process.env[name];

		if (typeof value === "string" && value.trim() !== "") {
			return value.trim();
		}

		return fallback;
	}

	private readNumber(name: string, fallback: number): number {
		const value = process.env[name];

		if (typeof value === "string" && value.trim() !== "") {
			const parsed = Number(value);

			if (!Number.isNaN(parsed)) {
				return parsed;
			}
		}

		return fallback;
	}

	private readBoolean(name: string, fallback = false): boolean {
		const value = process.env[name];

		if (typeof value !== "string") {
			return fallback;
		}

		return ["true", "1", "yes", "on"].includes(value.trim().toLowerCase());
	}

	private readArray(name: string, fallback: string[] = []): string[] {
		const value = process.env[name];

		if (typeof value !== "string" || value.trim() === "") {
			return fallback;
		}

		return value
			.split(",")
			.map((item) => item.trim())
			.filter(Boolean);
	}

	getRequiredEnv(name: string, value: string): string {
		if (typeof value === "string" && value.trim() !== "") {
			return value;
		}

		throw new Error(`Missing required environment variable: ${name}`);
	}

	private load(): AppEnv {
		return {
			nodeEnv: this.readString("NODE_ENV", "development"),
			port: this.readNumber("PORT", 5000),
			clientUrl: this.readString("CLIENT_URL", "*"),
			apiBaseUrl: this.readString("API_BASE_URL", ""),
			databaseUri: this.readString("DATABASE_URI", ""),
			jwtSecret: this.readString("JWT_SECRET", ""),
			jwtRefreshSecret: this.readString("JWT_REFRESH_SECRET", ""),
			jwtExpiresIn: this.readString("JWT_EXPIRES_IN", "7d"),
			jwtRefreshExpiresIn: this.readString("JWT_REFRESH_EXPIRES_IN", "30d"),
			jwtCookieName: this.readString("JWT_COOKIE_NAME", "access_token"),
			jwtRefreshCookieName: this.readString(
				"JWT_REFRESH_COOKIE_NAME",
				"refresh_token"
			),
			bcryptSaltRounds: this.readNumber("BCRYPT_SALT_ROUNDS", 10),
			socket: {
				path: this.readString("SOCKET_PATH", "/socket.io"),
				transports: this.readArray("SOCKET_TRANSPORTS", [
					"websocket",
					"polling"
				])
			},
			google: {
				clientId: this.readString("GOOGLE_CLIENT_ID", "")
			},
			email: {
				host: this.readString("EMAIL_HOST", ""),
				port: this.readNumber("EMAIL_PORT", 587),
				secure: this.readBoolean("EMAIL_SECURE", false),
				user: this.readString("EMAIL_USER", ""),
				pass: this.readString("EMAIL_PASS", ""),
				fromName: this.readString("EMAIL_FROM_NAME", "Expense Tracker"),
				fromAddress: this.readString("EMAIL_FROM_ADDRESS", "")
			},
			aws: {
				region: this.readString("AWS_REGION", ""),
				accessKeyId: this.readString("AWS_ACCESS_KEY_ID", ""),
				secretAccessKey: this.readString("AWS_SECRET_ACCESS_KEY", ""),
				s3Bucket: this.readString("AWS_S3_BUCKET", ""),
				s3Endpoint: this.readString("AWS_S3_ENDPOINT", "")
			},
			cloudinary: {
				cloudName: this.readString("CLOUDINARY_CLOUD_NAME", ""),
				apiKey: this.readString("CLOUDINARY_API_KEY", ""),
				apiSecret: this.readString("CLOUDINARY_API_SECRET", ""),
				folder: this.readString("CLOUDINARY_FOLDER", "expense-tracker")
			},
			upload: {
				maxFileSize: this.readNumber("UPLOAD_MAX_FILE_SIZE", 5 * 1024 * 1024),
				destination: this.readString("UPLOAD_DESTINATION", "uploads")
			}
		};
	}

	getAll(): AppEnv {
		return this.values;
	}

	refresh(): AppEnv {
		this.values = this.load();
		return this.values;
	}
}

export const envConfig = new EnvConfig();
export const env = envConfig.getAll();
export const getRequiredEnv = envConfig.getRequiredEnv.bind(envConfig);
