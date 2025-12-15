import { VERSION } from "./version";

export interface Message {
	role: "system" | "user" | string;
	content: string;
}

export interface WhisperLLMCard {
	name: string;
	type: "gguf"; // We only support GGUF for now.
	sourceUrl: string; // Download URL
	sizeGB: number; // Download size, in GB
	parametersB: number; // LLM parameters (billions)
	ramGB: number; // LLM RAM requirement, in GB
	systemMessage: {
		template: string; // `You are a 100% private on-device AI chat called Whisper. Today's date is {date_time_string}`
		defaultTemplateValues: Record<string, string>; // If App's lib doesn't support a new template variable, this is used as a fallback.
	};
}

export interface LLMCardCollection {
	[key: string]: WhisperLLMCard;
}

export interface WhisperLLMCardsJSON {
	version: string;
	recommendedCard: string;
	cards: LLMCardCollection;
}

type TemplateVariable = {
	resolver: (card: WhisperLLMCard, messages: Message[]) => string;
	defaultValue: string;
};

/**
 * Registry of template variables with their runtime resolvers and default fallback values.
 * Add new template variables here to extend functionality.
 */
export const templateVariables: Record<string, TemplateVariable> = {
	date_time_string: {
		resolver: () => new Date().toLocaleString(),
		defaultValue: new Date().getFullYear().toString(),
	},
};

export function processSystemMessage(
	card: WhisperLLMCard,
	messages: Message[],
): string {
	return card.systemMessage.template.replace(/{([^}]+)}/g, (match, key) => {
		if (typeof templateVariables[key] !== "undefined") {
			try {
				return templateVariables[key].resolver(card, messages);
			} catch {}
		}

		// Fallback hierarchy: card default -> registry default -> original string
		return card.systemMessage.defaultTemplateValues[key] ?? match;
	});
}

export const whisperLLMCardsJson: WhisperLLMCardsJSON = {
	version: VERSION,

	recommendedCard: "granite-4.0-h-micro-GGUF",

	cards: {
		"granite-4.0-h-micro-GGUF": {
			name: "Whisper AI Chat (Grnt 4.0 H 3B Micro Q3_K_M)",
			type: "gguf",
			sourceUrl:
				"https://huggingface.co/ibm-granite/granite-4.0-h-micro-GGUF/resolve/main/granite-4.0-h-micro-Q3_K_M.gguf",
			sizeGB: 1.56,
			parametersB: 3,
			ramGB: 3,
			systemMessage: {
				template:
					"You are a 100% private on-device AI chat called Whisper. Conversations stay on the device. Help the user concisly. Be useful, creative, and accurate. Today's date is {date_time_string}.",
				defaultTemplateValues: {
					date_time_string: templateVariables.date_time_string.defaultValue,
				},
			},
		},

		"llama-3.2-1b-instruct-q4_0": {
			name: "Whisper AI Chat (Ll 3.2 1B I Q4_0)",
			type: "gguf",
			sourceUrl:
				"https://huggingface.co/unsloth/Llama-3.2-1B-Instruct-GGUF/resolve/main/Llama-3.2-1B-Instruct-Q4_0.gguf?q=4",
			sizeGB: 0.72,
			parametersB: 1,
			ramGB: 1.5,
			systemMessage: {
				template:
					"You are a 100% private on-device AI chat called Whisper. Conversations stay on the device. Help the user concisly. Be useful, creative, and accurate. Today's date is {date_time_string}.",
				defaultTemplateValues: {
					date_time_string: templateVariables.date_time_string.defaultValue,
				},
			},
		},
	},
};

interface VersionsJSON {
	latest: string;
	channels: Record<string, string>;
}

/**
 * Resolves the latest version for the current channel (minor + patch)
 * @param baseUrl - Base URL for the repository
 * @returns The resolved version string (e.g., "1.0.5")
 */
async function resolveLatestVersion(
	baseUrl: string = "https://avatechnologies.org/whisper-llm-cards",
): Promise<string> {
	try {
		// Fetch versions.json from main branch
		const versionsUrl = `${baseUrl}/refs/heads/main/versions.json`;
		const response = await fetch(versionsUrl);

		if (!response.ok) {
			// Fallback to current VERSION if versions.json not found
			console.warn(
				`Could not fetch versions.json (${response.status}), using current version ${VERSION}`,
			);
			return VERSION;
		}

		const versions: VersionsJSON = await response.json();

		// Parse current version to get major.minor channel
		const [major, minor] = VERSION.split(".");
		const minorChannel = `${major}.${minor}`;
		const majorChannel = `${major}`;

		// Try major channel (e.g., "1" gets latest 1.x.x)
		if (versions.channels[majorChannel]) {
			return versions.channels[majorChannel];
		}

		// fallback to minor channel (e.g., "1.0" gets latest 1.0.x)
		if (versions.channels[minorChannel]) {
			return versions.channels[minorChannel];
		}

		// Fallback to current VERSION if channel not found
		console.warn(
			`Channels ${minorChannel} and ${majorChannel} not found in versions.json, using current version ${VERSION}`,
		);
		return VERSION;
	} catch (error) {
		// Fallback to current VERSION on any error
		console.warn(
			`Error resolving latest version: ${error}, using current version ${VERSION}`,
		);
		return VERSION;
	}
}

/**
 * Fetches the latest configuration for the current channel
 * Supports both minor and patch updates (e.g., 1.0.0 → 1.0.5 or 1.1.0)
 * @param latestConfigUrl - Optional custom URL to fetch config from. If not provided, automatically resolves to the latest version in the current channel.
 * @returns Promise resolving to the configuration
 */
export async function getLatestConfig(
	latestConfigUrl?: string,
): Promise<WhisperLLMCardsJSON> {
	// If custom URL provided, use it directly
	let configUrl = latestConfigUrl;

	// Otherwise, resolve latest version and construct URL
	if (!configUrl) {
		const resolvedVersion = await resolveLatestVersion();
		configUrl = `https://avatechnologies.org/whisper-llm-cards/refs/tags/v${resolvedVersion}/cards.json`;
	}

	const response = await fetch(configUrl);

	if (!response.ok) {
		throw new Error(
			`Failed to fetch config: ${response.status} ${response.statusText}`,
		);
	}

	const data = await response.json();

	// Transform the JSON structure to match WhisperLLMCardsJSON format
	const cardsData = data.cards;
	return {
		version: data.version,
		recommendedCard: data.recommendedCard
			? data.recommendedCard
			: Object.keys(cardsData)[0], // Use first model as recommended if not specified
		cards: cardsData,
	};
}
