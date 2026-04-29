import mongoose, {
	Schema,
	type HydratedDocument,
	type Model
} from "mongoose";

export type AuthProvider = "local" | "google";
export type UserRole = "user" | "admin";

export interface UserData {
	name: string;
	email: string;
	password?: string;
	avatar?: string | null;
	role: UserRole;
	authProvider: AuthProvider;
	googleId?: string | null;
	isEmailVerified: boolean;
	refreshTokenHash?: string | null;
	lastLoginAt?: Date | null;
	createdAt: Date;
	updatedAt: Date;
}

export type UserDocument = HydratedDocument<UserData>;

const userSchema = new Schema<UserData>(
	{
		name: {
			type: String,
			required: true,
			trim: true
		},
		email: {
			type: String,
			required: true,
			unique: true,
			lowercase: true,
			trim: true
		},
		password: {
			type: String,
			default: null
		},
		avatar: {
			type: String,
			default: null,
			trim: true
		},
		role: {
			type: String,
			enum: ["user", "admin"],
			default: "user"
		},
		authProvider: {
			type: String,
			enum: ["local", "google"],
			default: "local"
		},
		googleId: {
			type: String,
			default: null,
			index: true
		},
		isEmailVerified: {
			type: Boolean,
			default: false
		},
		refreshTokenHash: {
			type: String,
			default: null
		},
		lastLoginAt: {
			type: Date,
			default: null
		}
	},
	{
		timestamps: true
	}
);

export const User =
	(mongoose.models.User as Model<UserData> | undefined) ??
	mongoose.model<UserData>("User", userSchema);
