import type { Server as HttpServer } from "node:http";
import { Server, type ServerOptions } from "socket.io";
import { envConfig, type EnvConfig } from "./env";

export class SocketConfig {
	private io: Server | null = null;

	constructor(private readonly config: EnvConfig = envConfig) {}

	createOptions(overrides: Partial<ServerOptions> = {}): Partial<ServerOptions> {
		const env = this.config.getAll();

		return {
			path: env.socket.path,
			transports: env.socket.transports as ServerOptions["transports"],
			cors: {
				origin: env.clientUrl === "*" ? true : env.clientUrl,
				credentials: true
			},
			...overrides
		};
	}

	initialize(server: HttpServer, overrides: Partial<ServerOptions> = {}): Server {
		if (!server) {
			throw new Error("A Node HTTP server instance is required to initialize sockets.");
		}

		if (!this.io) {
			this.io = new Server(server, this.createOptions(overrides));
		}

		return this.io;
	}

	getInstance(): Server {
		if (!this.io) {
			throw new Error("Socket.io has not been initialized yet.");
		}

		return this.io;
	}
}

export const socketConfig = new SocketConfig();
export const createSocketOptions = socketConfig.createOptions.bind(socketConfig);
export const initializeSocket = socketConfig.initialize.bind(socketConfig);
export const getSocket = socketConfig.getInstance.bind(socketConfig);
