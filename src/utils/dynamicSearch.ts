type PrimitiveFilterValue = string | number | boolean | null | undefined;
type SearchQueryValue =
	| PrimitiveFilterValue
	| Record<string, unknown>
	| Array<Record<string, unknown>>;

export interface DynamicSearchParams {
	searchTerm?: string;
	searchFields?: string[];
	filters?: Record<string, SearchQueryValue>;
	exactFilters?: Record<string, SearchQueryValue>;
	customFilters?: Record<string, SearchQueryValue>;
}

export type DynamicSearchQuery = Record<string, SearchQueryValue>;

export const escapeRegularExpression = (value: string): string =>
	value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const createRegexCondition = (value: string): Record<string, string> => ({
	$regex: escapeRegularExpression(value),
	$options: "i"
});

export const dynamicSearch = ({
	searchTerm = "",
	searchFields = [],
	filters = {},
	exactFilters = {},
	customFilters = {}
}: DynamicSearchParams = {}): DynamicSearchQuery => {
	const query: DynamicSearchQuery = {};
	const normalizedSearchTerm =
		typeof searchTerm === "string" ? searchTerm.trim() : "";

	if (normalizedSearchTerm && searchFields.length > 0) {
		query.$or = searchFields.map((field) => ({
			[field]: createRegexCondition(normalizedSearchTerm)
		}));
	}

	for (const [key, value] of Object.entries(filters)) {
		if (value === undefined || value === null || value === "") {
			continue;
		}

		if (typeof value === "string") {
			query[key] = createRegexCondition(value.trim());
			continue;
		}

		query[key] = value;
	}

	for (const [key, value] of Object.entries(exactFilters)) {
		if (value === undefined || value === null || value === "") {
			continue;
		}

		query[key] = value;
	}

	for (const [key, value] of Object.entries(customFilters)) {
		if (value === undefined || value === null || value === "") {
			continue;
		}

		query[key] = value;
	}

	return query;
};
