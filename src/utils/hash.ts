import bcrypt from "bcryptjs";
import { envConfig } from "../config";

export const getSaltRounds = (): number => envConfig.getAll().bcryptSaltRounds;

export const hashValue = async (
	value: string,
	saltRounds = getSaltRounds()
): Promise<string> => {
	if (typeof value !== "string" || value.length === 0) {
		throw new Error("A non-empty string is required for hashing.");
	}

	return bcrypt.hash(value, saltRounds);
};

export const compareHash = async (
	plainValue: string,
	hashedValue: string
): Promise<boolean> => {
	if (!plainValue || !hashedValue) {
		return false;
	}

	return bcrypt.compare(plainValue, hashedValue);
};
