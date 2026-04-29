import { S3Client, type S3ClientConfig } from "@aws-sdk/client-s3";
import { envConfig, type EnvConfig } from "./env";

export interface ResolvedAwsConfig extends S3ClientConfig {
	s3Bucket: string;
}

export class AwsConfig {
	private client: S3Client | null = null;

	constructor(private readonly config: EnvConfig = envConfig) {}

	getConfig(): ResolvedAwsConfig {
		const env = this.config.getAll();

		const baseConfig: ResolvedAwsConfig = {
			region: this.config.getRequiredEnv("AWS_REGION", env.aws.region),
			credentials: {
				accessKeyId: this.config.getRequiredEnv(
					"AWS_ACCESS_KEY_ID",
					env.aws.accessKeyId
				),
				secretAccessKey: this.config.getRequiredEnv(
					"AWS_SECRET_ACCESS_KEY",
					env.aws.secretAccessKey
				)
			},
			s3Bucket: this.config.getRequiredEnv("AWS_S3_BUCKET", env.aws.s3Bucket)
		};

		if (env.aws.s3Endpoint) {
			baseConfig.endpoint = env.aws.s3Endpoint;
			baseConfig.forcePathStyle = true;
		}

		return baseConfig;
	}

	getS3Client(): S3Client {
		if (!this.client) {
			const { s3Bucket, ...clientConfig } = this.getConfig();
			void s3Bucket;
			this.client = new S3Client(clientConfig);
		}

		return this.client;
	}
}

export const awsConfig = new AwsConfig();
export const getAwsConfig = awsConfig.getConfig.bind(awsConfig);
export const getS3Client = awsConfig.getS3Client.bind(awsConfig);
