import { createServer, type Server as HttpServer } from "node:http";
import { app } from "./app";
import {
	connectDatabase,
	disconnectDatabase,
	env,
	initializeSocket
} from "./config";

let httpServer: HttpServer | null = null;

const shutdownSignals: NodeJS.Signals[] = ["SIGINT", "SIGTERM"];

async function shutdown(signal: string): Promise<void> {
	try {
		if (httpServer) {
			await new Promise<void>((resolve, reject) => {
				httpServer?.close((error) => {
					if (error) {
						reject(error);
						return;
					}

					resolve();
				});
			});
		}

		await disconnectDatabase();
	} catch (error) {
		console.error(`Failed to close HTTP server after ${signal}.`, error);
		process.exitCode = 1;
	} finally {
		process.exit();
	}
}

export async function startServer(): Promise<HttpServer> {
	if (httpServer) {
		return httpServer;
	}

	await connectDatabase();

	httpServer = createServer(app);

	const io = initializeSocket(httpServer);
	io.on("connection", (socket) => {
		socket.emit("connected", {
			id: socket.id,
			message: "Socket connection established."
		});
	});

	await new Promise<void>((resolve) => {
		httpServer?.listen(env.port, () => {
			console.log(`Server listening on port ${env.port}`);
			resolve();
		});
	});

	for (const signal of shutdownSignals) {
		process.once(signal, () => {
			void shutdown(signal);
		});
	}

	return httpServer;
}
