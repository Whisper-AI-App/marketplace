import { VERSION } from "./version";

// Re-export schemas and resolver
export {
	DeviceCapabilitiesSchema,
	ResolvedRuntimeSchema,
	ResolvedSamplingSchema,
	ResolvedRolesSchema,
	MultimodalConfigSchema,
	VisionConfigSchema,
	AudioConfigSchema,
	FilesConfigSchema,
	ResolvedMultimodalSchema,
	ResolvedVisionSchema,
	ResolvedAudioSchema,
	ResolvedFilesSchema,
	MmprojSchema,
	type DeviceCapabilities,
	type ResolvedRuntime,
	type ResolvedSampling,
	type ResolvedRoles,
	type ResolvedMultimodal,
} from "./schemas";
export { resolveRuntimeConfig, resolveMultimodalConfig } from "./resolver";

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
	runtime?: RuntimeConfig; // Optional runtime config for llama.rn inference
	multimodal?: MultimodalConfig; // Optional multimodal capability declaration
}

export interface LLMCardCollection {
	[key: string]: WhisperLLMCard;
}

export interface WhisperLLMCardsJSON {
	version: string;
	defaultRecommendedCard: string;
	cards: LLMCardCollection;
}

/**
 * Expression or value type helper.
 * Allows either a direct value or a JSONata expression string (prefixed with $).
 */
type ExprOr<T> = T | string;

/**
 * Sampling parameters for llama.rn completion.
 * Field names match llama.rn's NativeCompletionParams.
 * Values can be direct values or JSONata expression strings (prefixed with $).
 */
export interface SamplingParams {
	temperature?: ExprOr<number>; // Default: 0.8
	top_k?: ExprOr<number>; // Default: 40
	top_p?: ExprOr<number>; // Default: 0.95
	min_p?: ExprOr<number>; // Default: 0.05
	penalty_repeat?: ExprOr<number>; // Default: 1.0 (llama.rn uses penalty_repeat, not repeat_penalty)
	penalty_last_n?: ExprOr<number>; // Default: 64 (tokens to consider for penalty)
	seed?: ExprOr<number>; // Default: -1 (random)
}

export interface RoleMapping {
	user?: string; // Default: "user"
	assistant?: string; // Default: "assistant"
	system?: string; // Default: "system"
}

/**
 * Cache type values for KV cache.
 */
export type CacheType = "f16" | "f32" | "q8_0" | "q4_0";

/**
 * Runtime configuration for llama.rn inference.
 * Maps directly to initLlama ContextParams and completion CompletionParams.
 * Values can be direct values or JSONata expression strings (prefixed with $).
 */
export interface RuntimeConfig {
	// Context params (initLlama)
	n_ctx?: ExprOr<number>; // Context window. Default: 2048
	n_gpu_layers?: ExprOr<number>; // GPU layers for acceleration. Default: platform-dependent
	n_threads?: ExprOr<number>; // Thread count for inference
	flash_attn?: ExprOr<boolean>; // Enable flash attention. Default: false
	cache_type_k?: ExprOr<CacheType>; // KV cache key type
	cache_type_v?: ExprOr<CacheType>; // KV cache value type

	// Completion params
	n_predict?: ExprOr<number>; // Max tokens to generate. Default: 300
	sampling?: SamplingParams;
	stop?: string[]; // Stop sequences. Default: []

	// Chat format
	roles?: RoleMapping;
}

// ─── Multimodal Configuration ─────────────────────────────────

export interface MmprojConfig {
	sourceUrl: string;
	sizeGB: number;
}

export interface VisionConfig {
	enabled: ExprOr<boolean>;
	maxWidth: ExprOr<number>;
	maxHeight: ExprOr<number>;
	imageMinTokens?: ExprOr<number>;
	imageMaxTokens?: ExprOr<number>;
	supportedFormats?: string[];
}

export interface AudioConfig {
	enabled: ExprOr<boolean>;
	sampleRate?: ExprOr<number>;
	format?: string;
	maxDurationSeconds?: ExprOr<number>;
}

export interface FilesConfig {
	enabled: ExprOr<boolean>;
	maxSizeBytes?: ExprOr<number>;
	supportedTypes?: string[];
}

/**
 * Multimodal capability declaration for a model card.
 * When absent, the model has no multimodal capabilities.
 */
export interface MultimodalConfig {
	mmproj?: MmprojConfig;
	vision?: VisionConfig;
	audio?: AudioConfig;
	files?: FilesConfig;
}

// Re-export defaults from constants
export {
	DEFAULT_SAMPLING,
	DEFAULT_ROLES,
	DEFAULT_RUNTIME_CONFIG,
	DEFAULT_VISION,
	DEFAULT_AUDIO,
	DEFAULT_FILES,
} from "./constants";

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

	defaultRecommendedCard: "lfm2.5-1.2b-instruct-q6_k",

	cards: {
		"lfm2.5-1.2b-instruct-q6_k": {
			name: "Whisper AI (LFM2.5 1.2B I Q6_K)",
			type: "gguf",
			sourceUrl:
				"https://huggingface.co/LiquidAI/LFM2.5-1.2B-Instruct-GGUF/resolve/main/LFM2.5-1.2B-Instruct-Q6_K.gguf",
			sizeGB: 0.96,
			parametersB: 1.2,
			ramGB: 1.5,
			systemMessage: {
				template:
					"You are a 100% private on-device AI chat called Whisper. Conversations stay on the device. Help the user concisely. Be useful, creative, and accurate. Today's date is {date_time_string}.",
				defaultTemplateValues: {
					date_time_string: templateVariables.date_time_string.defaultValue,
				},
			},
			runtime: {
				// Context window: scales linearly with RAM (1.5GB = 1024, 3GB = 2048, etc.), floor of 512
				n_ctx: "$max([512, $round($ramGB * 1024 / 1.5)])",

				// GPU layers: iOS has good Metal support, Android GPU can be unstable
				n_gpu_layers: '$platform = "ios" ? 99 : 0',

				// Thread count: target ~50% of cores to use performance cores only
				n_threads: "$cpuCoreCount ? $max([2, $floor($cpuCoreCount * 0.5)]) : 1",

				// Flash attention: enable on iOS with sufficient RAM for performance boost
				flash_attn: '$platform = "ios" and $ramGB >= 4',

				// KV cache quantization: major memory savings with minimal quality loss
				// <4GB: q4_0 (aggressive), 4-8GB: q8_0 (balanced), >8GB: f16 (full precision)
				cache_type_k: '$ramGB < 4 ? "q4_0" : $ramGB < 8 ? "q8_0" : "f16"',
				cache_type_v: '$ramGB < 4 ? "q4_0" : $ramGB < 8 ? "q8_0" : "f16"',

				n_predict: -1,

				sampling: {
					temperature: 0.7,
					top_k: 40,
					top_p: 0.95,
					penalty_repeat: 1,
					penalty_last_n: 64,
					seed: 0,
				},
				stop: ["<|im_end|>"],
				roles: {
					user: "user",
					assistant: "assistant",
					system: "system",
				},
			},
		},

		"qwen3.5-2b-q4_k_m": {
			name: "Whisper AI Chat (Qwen3.5 2B Q4_K_M)",
			type: "gguf",
			sourceUrl:
				"https://huggingface.co/unsloth/Qwen3.5-2B-GGUF/resolve/main/Qwen3.5-2B-Q4_K_M.gguf",
			sizeGB: 1.28,
			parametersB: 2,
			ramGB: 3,
			systemMessage: {
				template:
					"You are a 100% private on-device AI chat called Whisper. Conversations stay on the device. Help the user concisely. Be useful, creative, and accurate. Today's date is {date_time_string}.",
				defaultTemplateValues: {
					date_time_string: templateVariables.date_time_string.defaultValue,
				},
			},
			runtime: {
				n_ctx: "$max([512, $round($ramGB * 1024 / 3)])",
				n_gpu_layers: '$platform = "ios" ? 99 : 0',
				n_threads:
					"$cpuCoreCount ? $max([2, $floor($cpuCoreCount * 0.5)]) : 1",
				flash_attn: '$platform = "ios" and $ramGB >= 4',
				cache_type_k: '$ramGB < 4 ? "q4_0" : $ramGB < 8 ? "q8_0" : "f16"',
				cache_type_v: '$ramGB < 4 ? "q4_0" : $ramGB < 8 ? "q8_0" : "f16"',
				n_predict: -1,
				sampling: {
					temperature: 0.7,
					top_k: 20,
					top_p: 0.8,
					penalty_repeat: 1.0,
					penalty_last_n: 64,
					seed: 0,
				},
				stop: ["<|im_end|>", "<|endoftext|>"],
			},
		},

		"qwen3.5-4b-q4_k_m": {
			name: "Whisper AI Vision (Qwen3.5 4B Q4_K_M)",
			type: "gguf",
			sourceUrl:
				"https://huggingface.co/unsloth/Qwen3.5-4B-GGUF/resolve/main/Qwen3.5-4B-Q4_K_M.gguf",
			sizeGB: 2.74,
			parametersB: 4,
			ramGB: 6,
			systemMessage: {
				template:
					"You are a 100% private on-device AI chat called Whisper. Conversations stay on the device. Help the user concisely. Be useful, creative, and accurate. You can see images when the user shares them. Today's date is {date_time_string}.",
				defaultTemplateValues: {
					date_time_string: templateVariables.date_time_string.defaultValue,
				},
			},
			runtime: {
				n_ctx: "$max([512, $round($ramGB * 1024 / 6)])",
				n_gpu_layers: '$platform = "ios" ? 99 : 0',
				n_threads:
					"$cpuCoreCount ? $max([2, $floor($cpuCoreCount * 0.5)]) : 1",
				flash_attn: '$platform = "ios" and $ramGB >= 6',
				cache_type_k: '$ramGB < 8 ? "q8_0" : "f16"',
				cache_type_v: '$ramGB < 8 ? "q8_0" : "f16"',
				n_predict: -1,
				sampling: {
					temperature: 0.7,
					top_k: 20,
					top_p: 0.8,
					penalty_repeat: 1.0,
					penalty_last_n: 64,
					seed: 0,
				},
				stop: ["<|im_end|>", "<|endoftext|>"],
			},
			multimodal: {
				mmproj: {
					sourceUrl:
						"https://huggingface.co/unsloth/Qwen3.5-4B-GGUF/resolve/main/mmproj-F16.gguf",
					sizeGB: 0.66,
				},
				vision: {
					enabled: "$ramGB >= 8",
					maxWidth: "$ramGB >= 10 ? 672 : 336",
					maxHeight: "$ramGB >= 10 ? 672 : 336",
					imageMinTokens: 128,
					imageMaxTokens: "$ramGB >= 10 ? 1024 : 256",
					supportedFormats: ["jpeg", "png", "webp"],
				},
			},
		},

		// "llama-3.2-1b-instruct-q4_0": {
		// 	name: "Whisper AI (Ll 3.2 1B I Q4_0)",
		// 	type: "gguf",
		// 	sourceUrl:
		// 		"https://huggingface.co/unsloth/Llama-3.2-1B-Instruct-GGUF/resolve/main/Llama-3.2-1B-Instruct-Q4_0.gguf",
		// 	sizeGB: 0.72,
		// 	parametersB: 1,
		// 	ramGB: 1.5,
		// 	systemMessage: {
		// 		template:
		// 			"You are a 100% private on-device AI chat called Whisper. Conversations stay on the device. Help the user concisly. Be useful, creative, and accurate. Today's date is {date_time_string}.",
		// 		defaultTemplateValues: {
		// 			date_time_string: templateVariables.date_time_string.defaultValue,
		// 		},
		// 	},
		// },

		// "granite-4.0-h-micro-GGUF": {
		// 	name: "Whisper AI (Grnt 4.0 H 3B Micro Q3_K_M)",
		// 	type: "gguf",
		// 	sourceUrl:
		// 		"https://huggingface.co/ibm-granite/granite-4.0-h-micro-GGUF/resolve/main/granite-4.0-h-micro-Q3_K_M.gguf",
		// 	sizeGB: 1.56,
		// 	parametersB: 3,
		// 	ramGB: 3,
		// 	systemMessage: {
		// 		template:
		// 			"You are a 100% private on-device AI chat called Whisper. Conversations stay on the device. Help the user concisly. Be useful, creative, and accurate. Today's date is {date_time_string}.",
		// 		defaultTemplateValues: {
		// 			date_time_string: templateVariables.date_time_string.defaultValue,
		// 		},
		// 	},
		// },
	},
};

interface VersionsJSON {
	latest: string;
	channels: Record<string, string>;
}

/**
 * Recommends a model card based on available RAM
 * @param ramGB - Available RAM in GB
 * @returns The recommended card name, or defaultRecommendedCard if no suitable match found
 */
export function recommendModelCard(ramGB?: number): string {
	let largestCard: { name: string; parametersB: number } | null = null;

	if (typeof ramGB === "number") {
		// Iterate through all cards to find the largest one that fits the criteria
		for (const [cardName, card] of Object.entries(whisperLLMCardsJson.cards)) {
			// Aproximate if this card meets the RAM requirement
			// Consume up to 75% of the device RAM, and assume LLM usage is 1.75x of it's parameter size.
			if (ramGB * 0.75 > card.parametersB * 1.75) {
				// If this is the first matching card or has more parameters than the current largest
				if (!largestCard || card.parametersB > largestCard.parametersB) {
					largestCard = { name: cardName, parametersB: card.parametersB };
				}
			}
		}
	}

	// Return the largest card that fits, or fallback to default
	return largestCard
		? largestCard.name
		: whisperLLMCardsJson.defaultRecommendedCard;
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
		const response = await fetch(versionsUrl, { cache: "no-store" });

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

	const response = await fetch(configUrl, { cache: "no-store" });

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
		defaultRecommendedCard: data.defaultRecommendedCard
			? data.defaultRecommendedCard
			: Object.keys(cardsData)[0], // Use first model as recommended if not specified
		cards: cardsData,
	};
}
