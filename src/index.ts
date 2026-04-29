import { startServer } from "./server";

export * from "./app";
export * from "./config";
export * from "./middleware";
export * from "./utils";

if (require.main === module) {
	void startServer();
}
