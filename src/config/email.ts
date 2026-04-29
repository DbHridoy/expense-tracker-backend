import { envConfig, type EnvConfig } from "./env";

export interface ResolvedEmailConfig {
	host: string;
	port: number;
	secure: boolean;
	auth: {
		user: string;
		pass: string;
	};
	defaultFrom: {
		name: string;
		address: string;
	};
	replyTo: string;
}

export class EmailConfig {
	constructor(private readonly config: EnvConfig = envConfig) {}

	getConfig(): ResolvedEmailConfig {
		const env = this.config.getAll();

		return {
			host: this.config.getRequiredEnv("EMAIL_HOST", env.email.host),
			port: env.email.port,
			secure: env.email.secure,
			auth: {
				user: this.config.getRequiredEnv("EMAIL_USER", env.email.user),
				pass: this.config.getRequiredEnv("EMAIL_PASS", env.email.pass)
			},
			defaultFrom: {
				name: env.email.fromName,
				address: this.config.getRequiredEnv(
					"EMAIL_FROM_ADDRESS",
					env.email.fromAddress
				)
			},
			replyTo: env.email.fromAddress
		};
	}
}

export const emailConfig = new EmailConfig();
export const getEmailConfig = emailConfig.getConfig.bind(emailConfig);
