import jsonata from "jsonata";
import {
	DeviceCapabilitiesSchema,
	ResolvedRuntimeSchema,
	ResolvedMultimodalSchema,
	type DeviceCapabilities,
	type ResolvedRuntime,
	type ResolvedMultimodal,
} from "./schemas";
import {
	DEFAULT_RUNTIME_CONFIG,
	DEFAULT_VISION,
	DEFAULT_AUDIO,
	DEFAULT_FILES,
} from "./constants";
import type { RuntimeConfig, MultimodalConfig } from "./index";

/**
 * Evaluates a JSONata expression string with device capabilities as context.
 * Expression strings are identified by the `$` prefix.
 *
 * @param obj - Value to evaluate (may be expression string, array, object, or primitive)
 * @param context - Device capabilities to use as expression context
 * @returns Evaluated value with all expressions resolved
 */
async function evaluateExpressions(
	obj: unknown,
	context: DeviceCapabilities,
): Promise<unknown> {
	// Expression strings start with $
	if (typeof obj === "string" && obj.startsWith("$")) {
		const expr = jsonata(obj);
		// Assign all device capability values to the expression context
		for (const [key, value] of Object.entries(context)) {
			if (value !== undefined) {
				expr.assign(key, value);
			}
		}
		return expr.evaluate({});
	}

	// Recursively process arrays
	if (Array.isArray(obj)) {
		return Promise.all(obj.map((item) => evaluateExpressions(item, context)));
	}

	// Recursively process objects
	if (obj !== null && typeof obj === "object") {
		const resolved: Record<string, unknown> = {};
		for (const [key, value] of Object.entries(obj)) {
			resolved[key] = await evaluateExpressions(value, context);
		}
		return resolved;
	}

	// Return primitives as-is
	return obj;
}

/**
 * Resolves a runtime configuration by evaluating all dynamic expressions.
 *
 * Expression strings in the config (prefixed with `$`) are evaluated using JSONata
 * with device capabilities as context. The result is validated against the
 * ResolvedRuntime schema.
 *
 * @param rawRuntime - Runtime config potentially containing expression strings
 * @param device - Device capabilities for expression evaluation
 * @returns Fully resolved and validated runtime configuration
 * @throws ZodError if device capabilities or resolved config fails validation
 *
 * @example
 * ```ts
 * const config = {
 *   n_ctx: '$ramGB < 4 ? 2048 : 4096',
 *   n_gpu_layers: '$platform = "ios" ? 99 : 0',
 *   sampling: { temperature: 0.7, top_p: 0.95 },
 *   // ...
 * };
 *
 * const resolved = await resolveRuntimeConfig(config, {
 *   ramGB: 8,
 *   platform: 'ios',
 * });
 * // resolved.n_ctx === 4096
 * // resolved.n_gpu_layers === 99
 * ```
 */
export async function resolveRuntimeConfig(
	rawRuntime: RuntimeConfig | undefined,
	device: DeviceCapabilities,
): Promise<ResolvedRuntime> {
	// Validate device capabilities
	const validatedDevice = DeviceCapabilitiesSchema.parse(device);

	// Merge with defaults to ensure all required fields
	const configWithDefaults = {
		n_ctx: rawRuntime?.n_ctx ?? DEFAULT_RUNTIME_CONFIG.n_ctx,
		n_predict: rawRuntime?.n_predict ?? DEFAULT_RUNTIME_CONFIG.n_predict,
		n_gpu_layers: rawRuntime?.n_gpu_layers,
		n_threads: rawRuntime?.n_threads,
		flash_attn: rawRuntime?.flash_attn,
		cache_type_k: rawRuntime?.cache_type_k,
		cache_type_v: rawRuntime?.cache_type_v,
		sampling: {
			temperature:
				rawRuntime?.sampling?.temperature ??
				DEFAULT_RUNTIME_CONFIG.sampling.temperature,
			top_k: rawRuntime?.sampling?.top_k ?? DEFAULT_RUNTIME_CONFIG.sampling.top_k,
			top_p:
				rawRuntime?.sampling?.top_p ?? DEFAULT_RUNTIME_CONFIG.sampling.top_p,
			min_p: rawRuntime?.sampling?.min_p,
			penalty_repeat: rawRuntime?.sampling?.penalty_repeat,
			penalty_freq: rawRuntime?.sampling?.penalty_freq,
			penalty_present: rawRuntime?.sampling?.penalty_present,
			penalty_last_n: rawRuntime?.sampling?.penalty_last_n,
			seed: rawRuntime?.sampling?.seed,
		},
		stop: rawRuntime?.stop ?? DEFAULT_RUNTIME_CONFIG.stop,
		roles: {
			user: rawRuntime?.roles?.user ?? DEFAULT_RUNTIME_CONFIG.roles.user,
			assistant:
				rawRuntime?.roles?.assistant ?? DEFAULT_RUNTIME_CONFIG.roles.assistant,
			system: rawRuntime?.roles?.system ?? DEFAULT_RUNTIME_CONFIG.roles.system,
		},
	};

	// Evaluate all expressions
	const resolved = await evaluateExpressions(configWithDefaults, validatedDevice);

	// Validate and return
	return ResolvedRuntimeSchema.parse(resolved);
}

/**
 * Resolves a multimodal configuration by evaluating all dynamic expressions.
 *
 * @param rawMultimodal - Multimodal config potentially containing expression strings
 * @param device - Device capabilities for expression evaluation
 * @returns Fully resolved multimodal configuration, or undefined if input is undefined
 */
export async function resolveMultimodalConfig(
	rawMultimodal: MultimodalConfig | undefined,
	device: DeviceCapabilities,
): Promise<ResolvedMultimodal | undefined> {
	if (!rawMultimodal) return undefined;

	const validatedDevice = DeviceCapabilitiesSchema.parse(device);

	const configToResolve: Record<string, unknown> = {};

	// mmproj is static (no expressions), pass through
	if (rawMultimodal.mmproj) {
		configToResolve.mmproj = rawMultimodal.mmproj;
	}

	// Vision: merge defaults for optional fields
	if (rawMultimodal.vision) {
		configToResolve.vision = {
			enabled: rawMultimodal.vision.enabled,
			maxWidth: rawMultimodal.vision.maxWidth,
			maxHeight: rawMultimodal.vision.maxHeight,
			imageMinTokens: rawMultimodal.vision.imageMinTokens,
			imageMaxTokens: rawMultimodal.vision.imageMaxTokens,
			supportedFormats:
				rawMultimodal.vision.supportedFormats ?? DEFAULT_VISION.supportedFormats,
		};
	}

	// Audio: merge defaults
	if (rawMultimodal.audio) {
		configToResolve.audio = {
			enabled: rawMultimodal.audio.enabled,
			sampleRate: rawMultimodal.audio.sampleRate ?? DEFAULT_AUDIO.sampleRate,
			format: rawMultimodal.audio.format ?? DEFAULT_AUDIO.format,
			maxDurationSeconds:
				rawMultimodal.audio.maxDurationSeconds ?? DEFAULT_AUDIO.maxDurationSeconds,
		};
	}

	// Files: merge defaults
	if (rawMultimodal.files) {
		configToResolve.files = {
			enabled: rawMultimodal.files.enabled,
			maxSizeBytes:
				rawMultimodal.files.maxSizeBytes ?? DEFAULT_FILES.maxSizeBytes,
			supportedTypes:
				rawMultimodal.files.supportedTypes ?? DEFAULT_FILES.supportedTypes,
		};
	}

	const resolved = await evaluateExpressions(configToResolve, validatedDevice);
	return ResolvedMultimodalSchema.parse(resolved);
}
