import mongoose, { type Connection } from "mongoose";
import { envConfig, type EnvConfig } from "./env";

export class DatabaseConfig {
	constructor(private readonly config: EnvConfig = envConfig) {}

	async connect(connectionUri = this.config.getAll().databaseUri): Promise<Connection> {
		const uri = this.config.getRequiredEnv("DATABASE_URI", connectionUri);

		mongoose.set("strictQuery", true);
		await mongoose.connect(uri);

		return mongoose.connection;
	}

	async disconnect(): Promise<Connection> {
		if (mongoose.connection.readyState === 0) {
			return mongoose.connection;
		}

		await mongoose.disconnect();
		return mongoose.connection;
	}
}

export const databaseConfig = new DatabaseConfig();
export const connectDatabase = databaseConfig.connect.bind(databaseConfig);
export const disconnectDatabase = databaseConfig.disconnect.bind(databaseConfig);
