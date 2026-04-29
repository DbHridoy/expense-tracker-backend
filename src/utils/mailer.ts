import nodemailer, {
	type SendMailOptions,
	type SentMessageInfo,
	type Transporter
} from "nodemailer";
import { emailConfig, type EmailConfig } from "../config";

export interface MailOptions extends SendMailOptions {
	replyTo?: string;
}

export class MailerService {
	private transporter: Transporter<SentMessageInfo> | null = null;

	constructor(private readonly config: EmailConfig = emailConfig) {}

	buildFromAddress(
		fromOverride: SendMailOptions["from"],
		defaultFrom: { name: string; address: string }
	): SendMailOptions["from"] {
		if (fromOverride) {
			return fromOverride;
		}

		return `"${defaultFrom.name}" <${defaultFrom.address}>`;
	}

	getTransporter(): Transporter<SentMessageInfo> {
		if (!this.transporter) {
			const config = this.config.getConfig();

			this.transporter = nodemailer.createTransport({
				host: config.host,
				port: config.port,
				secure: config.secure,
				auth: config.auth
			});
		}

		return this.transporter;
	}

	async sendMail(options: MailOptions): Promise<SentMessageInfo> {
		const config = this.config.getConfig();
		const { to, subject, text, html, from, replyTo, cc, bcc, attachments } =
			options;

		return this.getTransporter().sendMail({
			from: this.buildFromAddress(from, config.defaultFrom),
			replyTo: replyTo || config.replyTo,
			to,
			cc,
			bcc,
			subject,
			text,
			html,
			attachments
		});
	}

	async verifyConnection(): Promise<boolean> {
		return this.getTransporter().verify();
	}
}

export const mailerService = new MailerService();
export const getMailerTransporter = mailerService.getTransporter.bind(mailerService);
export const sendMail = mailerService.sendMail.bind(mailerService);
export const verifyMailerConnection =
	mailerService.verifyConnection.bind(mailerService);
