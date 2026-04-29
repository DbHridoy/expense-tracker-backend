import mongoose, { Schema, type HydratedDocument, type Model } from "mongoose";

export interface NotificationData {
	recipient: mongoose.Types.ObjectId;
	title: string;
	message: string;
	type: string;
	entityType: string | null;
	entityId: mongoose.Schema.Types.Mixed | null;
	link: string | null;
	metadata: Record<string, unknown>;
	isRead: boolean;
	createdAt: Date;
	updatedAt: Date;
}

export type NotificationDocument = HydratedDocument<NotificationData>;

export const notificationSchema = new Schema<NotificationData>(
	{
		recipient: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
			index: true
		},
		title: {
			type: String,
			required: true,
			trim: true
		},
		message: {
			type: String,
			required: true,
			trim: true
		},
		type: {
			type: String,
			default: "general",
			trim: true
		},
		entityType: {
			type: String,
			default: null,
			trim: true
		},
		entityId: {
			type: Schema.Types.Mixed,
			default: null
		},
		link: {
			type: String,
			default: null,
			trim: true
		},
		metadata: {
			type: Schema.Types.Mixed,
			default: {}
		},
		isRead: {
			type: Boolean,
			default: false
		}
	},
	{
		timestamps: true
	}
);

export const Notification =
	(mongoose.models.Notification as Model<NotificationData> | undefined) ??
	mongoose.model<NotificationData>("Notification", notificationSchema);
