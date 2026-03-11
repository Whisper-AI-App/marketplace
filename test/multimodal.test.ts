/// <reference path="../types.d.ts" />
import test from "ava";
import {
	MultimodalConfigSchema,
	ResolvedMultimodalSchema,
	MmprojSchema,
	VisionConfigSchema,
	AudioConfigSchema,
	FilesConfigSchema,
} from "../src";

// T008: Multimodal config validation tests

test("valid multimodal config with all fields passes schema", (t) => {
	const config = {
		mmproj: {
			sourceUrl: "https://huggingface.co/example/mmproj.gguf",
			sizeGB: 0.66,
		},
		vision: {
			enabled: true,
			maxWidth: 672,
			maxHeight: 672,
			imageMinTokens: 128,
			imageMaxTokens: 1024,
			supportedFormats: ["jpeg", "png", "webp"],
		},
		audio: {
			enabled: true,
			sampleRate: 16000,
			format: "wav",
			maxDurationSeconds: 120,
		},
		files: {
			enabled: true,
			maxSizeBytes: 10485760,
			supportedTypes: ["txt", "md", "json"],
		},
	};
	const result = MultimodalConfigSchema.safeParse(config);
	t.true(result.success);
});

test("valid vision-only config passes", (t) => {
	const config = {
		mmproj: {
			sourceUrl: "https://huggingface.co/example/mmproj.gguf",
			sizeGB: 0.5,
		},
		vision: {
			enabled: true,
			maxWidth: 336,
			maxHeight: 336,
		},
	};
	const result = MultimodalConfigSchema.safeParse(config);
	t.true(result.success);
});

test("missing required vision fields fail", (t) => {
	const config = {
		vision: {
			enabled: true,
			// missing maxWidth, maxHeight
		},
	};
	const result = VisionConfigSchema.safeParse(config.vision);
	t.false(result.success);
});

test("expression strings accepted for ExprOr fields", (t) => {
	const config = {
		vision: {
			enabled: "$ramGB >= 4",
			maxWidth: "$ramGB >= 8 ? 672 : 336",
			maxHeight: "$ramGB >= 8 ? 672 : 336",
			imageMaxTokens: "$ramGB >= 8 ? 1024 : 256",
		},
	};
	const result = MultimodalConfigSchema.safeParse(config);
	t.true(result.success);
});

test("invalid mmproj URL fails", (t) => {
	const config = {
		sourceUrl: "not-a-url",
		sizeGB: 0.5,
	};
	const result = MmprojSchema.safeParse(config);
	t.false(result.success);
});

test("empty config object passes (all fields optional)", (t) => {
	const result = MultimodalConfigSchema.safeParse({});
	t.true(result.success);
});

test("resolved multimodal schema validates concrete values", (t) => {
	const resolved = {
		mmproj: {
			sourceUrl: "https://huggingface.co/example/mmproj.gguf",
			sizeGB: 0.66,
		},
		vision: {
			enabled: true,
			maxWidth: 672,
			maxHeight: 672,
			imageMinTokens: 128,
			imageMaxTokens: 1024,
			supportedFormats: ["jpeg", "png"],
		},
	};
	const result = ResolvedMultimodalSchema.safeParse(resolved);
	t.true(result.success);
});

test("resolved vision rejects expression strings", (t) => {
	const resolved = {
		vision: {
			enabled: "$ramGB >= 4", // should be boolean
			maxWidth: 672,
			maxHeight: 672,
			supportedFormats: ["jpeg"],
		},
	};
	const result = ResolvedMultimodalSchema.safeParse(resolved);
	t.false(result.success);
});

test("audio config with defaults only requires enabled", (t) => {
	const config = {
		enabled: true,
	};
	const result = AudioConfigSchema.safeParse(config);
	t.true(result.success);
});

test("files config with defaults only requires enabled", (t) => {
	const config = {
		enabled: false,
	};
	const result = FilesConfigSchema.safeParse(config);
	t.true(result.success);
});
