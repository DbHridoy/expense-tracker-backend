import type { Server } from "socket.io";
import mongoose, { type Model } from "mongoose";
import {
	Notification,
	type NotificationData,
	type NotificationDocument
} from "../modules/common/notification.model";

export interface CreateNotificationParams {
	recipient: mongoose.Types.ObjectId | string;
	title: string;
	message: string;
	type?: string;
	entityType?: string | null;
	entityId?: unknown;
	link?: string | null;
	metadata?: Record<string, unknown>;
	model?: Model<NotificationData>;
	io?: Server | null;
	socketEvent?: string;
}

export const createNotification = async ({
	recipient,
	title,
	message,
	type = "general",
	entityType = null,
	entityId = null,
	link = null,
	metadata = {},
	model = Notification,
	io = null,
	socketEvent = "notification:new"
}: CreateNotificationParams): Promise<NotificationDocument> => {
	if (!recipient) {
		throw new Error("Notification recipient is required.");
	}

	if (!title || !message) {
		throw new Error("Notification title and message are required.");
	}

	const notification = await model.create({
		recipient: recipient as NotificationData["recipient"],
		title,
		message,
		type,
		entityType,
		entityId: entityId as NotificationData["entityId"],
		link,
		metadata: metadata as NotificationData["metadata"]
	});

	if (io) {
		io.to(String(recipient)).emit(socketEvent, notification);
	}

	return notification as NotificationDocument;
};
