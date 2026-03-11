/**
 * Default sampling parameters for llama.rn completion.
 */
export const DEFAULT_SAMPLING = {
	temperature: 0.8,
	top_k: 40,
	top_p: 0.95,
	min_p: 0.05,
	penalty_repeat: 1.0,
	penalty_last_n: 64,
	seed: -1,
} as const;

/**
 * Default role mappings for chat format.
 */
export const DEFAULT_ROLES = {
	user: "user",
	assistant: "assistant",
	system: "system",
} as const;

/**
 * Default runtime configuration values.
 */
export const DEFAULT_RUNTIME_CONFIG = {
	n_ctx: 2048,
	n_predict: -1,
	sampling: DEFAULT_SAMPLING,
	stop: [] as string[],
	roles: DEFAULT_ROLES,
} as const;

/**
 * Default vision configuration values.
 */
export const DEFAULT_VISION = {
	supportedFormats: ["jpeg", "png"],
} as const;

/**
 * Default audio configuration values.
 */
export const DEFAULT_AUDIO = {
	sampleRate: 16000,
	format: "wav",
	maxDurationSeconds: 120,
} as const;

/**
 * Default files configuration values.
 */
export const DEFAULT_FILES = {
	maxSizeBytes: 10 * 1024 * 1024, // 10 MB
	supportedTypes: ["txt", "md", "json", "csv"],
} as const;
