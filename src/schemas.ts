import { z } from "zod";

/**
 * Device capabilities used for evaluating dynamic runtime expressions.
 * These values are collected at runtime from the device.
 */
export const DeviceCapabilitiesSchema = z.object({
	ramGB: z.number(),
	platform: z.enum(["ios", "android", "ipados", "windows"]),
	deviceType: z
		.enum(["phone", "tablet", "desktop", "tv", "unknown"])
		.optional(),
	modelName: z.string().optional(),
	cpuArch: z.string().optional(),
	cpuCoreCount: z.number().int().positive().optional(),
});

/**
 * Sampling parameters after resolution.
 * All dynamic expressions have been evaluated to their final values.
 */
export const ResolvedSamplingSchema = z.object({
	temperature: z.number().min(0).max(2),
	top_k: z.number().int().positive().optional(),
	top_p: z.number().min(0).max(1),
	min_p: z.number().min(0).max(1).optional(),
	penalty_repeat: z.number().optional(),
	penalty_last_n: z.number().int().optional(),
	seed: z.number().int().optional(),
});

/**
 * Role mapping after resolution.
 */
export const ResolvedRolesSchema = z.object({
	user: z.string(),
	assistant: z.string(),
	system: z.string(),
});

/**
 * Fully resolved runtime configuration.
 * All dynamic expressions have been evaluated to their final values.
 */
/**
 * Valid KV cache quantization types.
 * Should match model quantization for best quality/memory tradeoff.
 */
const CacheTypeEnum = z.enum([
	"f16",
	"f32",
	"q8_0",
	"q5_1",
	"q5_0",
	"q4_1",
	"q4_0",
	"iq4_nl",
]);

export const ResolvedRuntimeSchema = z.object({
	n_ctx: z.number().int().positive(),
	n_predict: z.number().int(),
	n_gpu_layers: z.number().int().min(0).optional(),
	n_threads: z.number().int().positive().optional(),
	flash_attn: z.boolean().optional(),
	cache_type_k: CacheTypeEnum.optional(),
	cache_type_v: CacheTypeEnum.optional(),
	sampling: ResolvedSamplingSchema,
	stop: z.array(z.string()),
	roles: ResolvedRolesSchema,
});

export type DeviceCapabilities = z.infer<typeof DeviceCapabilitiesSchema>;
export type ResolvedSampling = z.infer<typeof ResolvedSamplingSchema>;
export type ResolvedRoles = z.infer<typeof ResolvedRolesSchema>;
export type ResolvedRuntime = z.infer<typeof ResolvedRuntimeSchema>;

// ─── Multimodal Schemas ────────────────────────────────────────

const exprOrBoolean = z.union([z.boolean(), z.string()]);
const exprOrNumber = z.union([z.number(), z.string()]);

/**
 * Mmproj projector model configuration.
 */
export const MmprojSchema = z.object({
	sourceUrl: z.string().url(),
	sizeGB: z.number().positive(),
});

/**
 * Vision/image capabilities (pre-resolution, allows ExprOr strings).
 */
export const VisionConfigSchema = z.object({
	enabled: exprOrBoolean,
	maxWidth: exprOrNumber,
	maxHeight: exprOrNumber,
	imageMinTokens: exprOrNumber.optional(),
	imageMaxTokens: exprOrNumber.optional(),
	supportedFormats: z.array(z.string()).optional(),
});

/**
 * Audio input capabilities (pre-resolution).
 */
export const AudioConfigSchema = z.object({
	enabled: exprOrBoolean,
	sampleRate: exprOrNumber.optional(),
	format: z.string().optional(),
	maxDurationSeconds: exprOrNumber.optional(),
});

/**
 * File/document input capabilities (pre-resolution).
 */
export const FilesConfigSchema = z.object({
	enabled: exprOrBoolean,
	maxSizeBytes: exprOrNumber.optional(),
	supportedTypes: z.array(z.string()).optional(),
});

/**
 * Full multimodal configuration (pre-resolution).
 */
export const MultimodalConfigSchema = z.object({
	mmproj: MmprojSchema.optional(),
	vision: VisionConfigSchema.optional(),
	audio: AudioConfigSchema.optional(),
	files: FilesConfigSchema.optional(),
});

/**
 * Resolved vision config (all expressions evaluated).
 */
export const ResolvedVisionSchema = z.object({
	enabled: z.boolean(),
	maxWidth: z.number().int().positive(),
	maxHeight: z.number().int().positive(),
	imageMinTokens: z.number().int().nonnegative().optional(),
	imageMaxTokens: z.number().int().positive().optional(),
	supportedFormats: z.array(z.string()),
});

/**
 * Resolved audio config.
 */
export const ResolvedAudioSchema = z.object({
	enabled: z.boolean(),
	sampleRate: z.number().int().positive(),
	format: z.string(),
	maxDurationSeconds: z.number().int().positive(),
});

/**
 * Resolved files config.
 */
export const ResolvedFilesSchema = z.object({
	enabled: z.boolean(),
	maxSizeBytes: z.number().int().positive(),
	supportedTypes: z.array(z.string()),
});

/**
 * Fully resolved multimodal configuration.
 */
export const ResolvedMultimodalSchema = z.object({
	mmproj: MmprojSchema.optional(),
	vision: ResolvedVisionSchema.optional(),
	audio: ResolvedAudioSchema.optional(),
	files: ResolvedFilesSchema.optional(),
});

export type ResolvedMultimodal = z.infer<typeof ResolvedMultimodalSchema>;
