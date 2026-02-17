/// <reference path="../types.d.ts" />
import test from "ava";
import {
	resolveRuntimeConfig,
	type DeviceCapabilities,
	type RuntimeConfig,
} from "../src";

// Test device configurations for different device tiers
const lowEndDevice: DeviceCapabilities = {
	ramGB: 3,
	platform: "android",
	deviceType: "phone",
	modelName: "Pixel 4a",
	cpuArch: "arm64-v8a",
	cpuCoreCount: 4,
};

const midRangeDevice: DeviceCapabilities = {
	ramGB: 6,
	platform: "ios",
	deviceType: "phone",
	modelName: "iPhone 12",
	cpuArch: "arm64",
	cpuCoreCount: 6,
};

const highEndDevice: DeviceCapabilities = {
	ramGB: 12,
	platform: "ios",
	deviceType: "tablet",
	modelName: "iPad Pro",
	cpuArch: "arm64",
	cpuCoreCount: 8,
};

// Basic expression evaluation tests
test("resolves simple static config without expressions", async (t) => {
	const config: RuntimeConfig = {
		n_ctx: 2048,
		n_predict: -1,
		sampling: {
			temperature: 0.7,
			top_p: 0.95,
		},
		stop: ["<|im_end|>"],
		roles: {
			user: "user",
			assistant: "assistant",
			system: "system",
		},
	};

	const resolved = await resolveRuntimeConfig(config, midRangeDevice);

	t.is(resolved.n_ctx, 2048);
	t.is(resolved.n_predict, -1);
	t.is(resolved.sampling.temperature, 0.7);
	t.is(resolved.sampling.top_p, 0.95);
	t.deepEqual(resolved.stop, ["<|im_end|>"]);
});

test("evaluates ramGB-based n_ctx expression", async (t) => {
	const config: RuntimeConfig = {
		n_ctx: "$ramGB < 4 ? 1024 : $ramGB < 8 ? 2048 : 4096",
		n_predict: -1,
		sampling: { temperature: 0.7, top_p: 0.95 },
		stop: [],
		roles: { user: "user", assistant: "assistant", system: "system" },
	};

	const lowEndResolved = await resolveRuntimeConfig(config, lowEndDevice);
	t.is(lowEndResolved.n_ctx, 1024, "Low-end device should get 1024 context");

	const midRangeResolved = await resolveRuntimeConfig(config, midRangeDevice);
	t.is(midRangeResolved.n_ctx, 2048, "Mid-range device should get 2048 context");

	const highEndResolved = await resolveRuntimeConfig(config, highEndDevice);
	t.is(highEndResolved.n_ctx, 4096, "High-end device should get 4096 context");
});

test("evaluates platform-based n_gpu_layers expression", async (t) => {
	const config: RuntimeConfig = {
		n_ctx: 2048,
		n_gpu_layers: '$platform = "ios" ? 99 : 0',
		n_predict: -1,
		sampling: { temperature: 0.7, top_p: 0.95 },
		stop: [],
		roles: { user: "user", assistant: "assistant", system: "system" },
	};

	const iosResolved = await resolveRuntimeConfig(config, midRangeDevice);
	t.is(iosResolved.n_gpu_layers, 99, "iOS device should use GPU layers");

	const androidResolved = await resolveRuntimeConfig(config, lowEndDevice);
	t.is(androidResolved.n_gpu_layers, 0, "Android device should not use GPU layers");
});

test("evaluates cpuCoreCount-based n_threads expression", async (t) => {
	const config: RuntimeConfig = {
		n_ctx: 2048,
		n_threads: "$cpuCoreCount ? $floor($cpuCoreCount * 0.75) : 4",
		n_predict: -1,
		sampling: { temperature: 0.7, top_p: 0.95 },
		stop: [],
		roles: { user: "user", assistant: "assistant", system: "system" },
	};

	const resolved4Core = await resolveRuntimeConfig(config, lowEndDevice);
	t.is(resolved4Core.n_threads, 3, "4-core device should get 3 threads (floor(4*0.75))");

	const resolved8Core = await resolveRuntimeConfig(config, highEndDevice);
	t.is(resolved8Core.n_threads, 6, "8-core device should get 6 threads (floor(8*0.75))");
});

test("evaluates cache_type expressions based on RAM", async (t) => {
	const config: RuntimeConfig = {
		n_ctx: 2048,
		n_predict: -1,
		cache_type_k: '$ramGB < 4 ? "q4_0" : "f16"',
		cache_type_v: '$ramGB < 4 ? "q4_0" : "f16"',
		sampling: { temperature: 0.7, top_p: 0.95 },
		stop: [],
		roles: { user: "user", assistant: "assistant", system: "system" },
	};

	const lowEndResolved = await resolveRuntimeConfig(config, lowEndDevice);
	t.is(lowEndResolved.cache_type_k, "q4_0", "Low-end device should use q4_0 cache");
	t.is(lowEndResolved.cache_type_v, "q4_0", "Low-end device should use q4_0 cache");

	const highEndResolved = await resolveRuntimeConfig(config, highEndDevice);
	t.is(highEndResolved.cache_type_k, "f16", "High-end device should use f16 cache");
	t.is(highEndResolved.cache_type_v, "f16", "High-end device should use f16 cache");
});

test("evaluates sampling expressions", async (t) => {
	const config: RuntimeConfig = {
		n_ctx: 2048,
		n_predict: -1,
		sampling: {
			temperature: "$ramGB < 4 ? 0.6 : 0.8",
			top_p: "$ramGB < 4 ? 0.85 : 0.95",
		},
		stop: [],
		roles: { user: "user", assistant: "assistant", system: "system" },
	};

	const lowEndResolved = await resolveRuntimeConfig(config, lowEndDevice);
	t.is(lowEndResolved.sampling.temperature, 0.6, "Low-end should have lower temperature");
	t.is(lowEndResolved.sampling.top_p, 0.85, "Low-end should have lower top_p");

	const highEndResolved = await resolveRuntimeConfig(config, highEndDevice);
	t.is(highEndResolved.sampling.temperature, 0.8, "High-end should have higher temperature");
	t.is(highEndResolved.sampling.top_p, 0.95, "High-end should have higher top_p");
});

test("applies defaults for missing config fields", async (t) => {
	const config: RuntimeConfig = {
		n_ctx: 4096,
		n_predict: -1,
		stop: ["<|end|>"],
		roles: { user: "human", assistant: "ai", system: "sys" },
	};

	const resolved = await resolveRuntimeConfig(config, midRangeDevice);

	// Should use provided values
	t.is(resolved.n_ctx, 4096);
	t.is(resolved.n_predict, -1);
	t.deepEqual(resolved.stop, ["<|end|>"]);
	t.is(resolved.roles.user, "human");
	t.is(resolved.roles.assistant, "ai");
	t.is(resolved.roles.system, "sys");

	// Should apply defaults for missing sampling params
	t.is(typeof resolved.sampling.temperature, "number");
	t.is(typeof resolved.sampling.top_p, "number");
});

test("handles undefined runtime config", async (t) => {
	const resolved = await resolveRuntimeConfig(undefined, midRangeDevice);

	// Should use all defaults
	t.is(resolved.n_ctx, 2048);
	t.is(resolved.n_predict, -1); // Default is -1 (unlimited)
	t.is(typeof resolved.sampling.temperature, "number");
	t.deepEqual(resolved.stop, []);
	t.is(resolved.roles.user, "user");
	t.is(resolved.roles.assistant, "assistant");
	t.is(resolved.roles.system, "system");
});

test("validates device capabilities", async (t) => {
	const config: RuntimeConfig = { n_ctx: 2048, n_predict: -1, stop: [], roles: { user: "user", assistant: "assistant", system: "system" } };

	// Invalid platform should throw
	await t.throwsAsync(
		async () => {
			await resolveRuntimeConfig(config, {
				ramGB: 8,
				platform: "invalid" as DeviceCapabilities["platform"],
			});
		},
		{ message: /Invalid enum value/ },
	);
});

test("validates resolved output", async (t) => {
	// Expression that returns invalid value for n_ctx (negative)
	const config: RuntimeConfig = {
		n_ctx: "$ramGB - 100", // Would be negative with 3GB RAM
		n_predict: -1,
		sampling: { temperature: 0.7, top_p: 0.95 },
		stop: [],
		roles: { user: "user", assistant: "assistant", system: "system" },
	};

	await t.throwsAsync(
		async () => {
			await resolveRuntimeConfig(config, lowEndDevice);
		},
		{ message: /Number must be greater than 0/ },
	);
});

// Complex expression tests
test("evaluates complex JSONata expressions", async (t) => {
	const config: RuntimeConfig = {
		n_ctx: '$deviceType = "tablet" ? 8192 : $ramGB > 8 ? 4096 : 2048',
		n_gpu_layers: '$platform = "ios" ? ($deviceType = "tablet" ? 99 : 50) : 0',
		n_predict: -1,
		sampling: { temperature: 0.7, top_p: 0.95 },
		stop: [],
		roles: { user: "user", assistant: "assistant", system: "system" },
	};

	const tabletResolved = await resolveRuntimeConfig(config, highEndDevice);
	t.is(tabletResolved.n_ctx, 8192, "Tablet should get 8192 context");
	t.is(tabletResolved.n_gpu_layers, 99, "iOS tablet should get 99 GPU layers");

	const phoneResolved = await resolveRuntimeConfig(config, midRangeDevice);
	t.is(phoneResolved.n_ctx, 2048, "Phone with 6GB should get 2048 context");
	t.is(phoneResolved.n_gpu_layers, 50, "iOS phone should get 50 GPU layers");
});

// Test that all cards with runtime config resolve successfully across device tiers
test("resolves all card runtime configs for various device tiers", async (t) => {
	const { resolveRuntimeConfig, whisperLLMCardsJson } = await import("../src");

	const deviceTiers: DeviceCapabilities[] = [
		{ ramGB: 3, platform: "android", deviceType: "phone", cpuCoreCount: 4 },
		{ ramGB: 6, platform: "ios", deviceType: "phone", cpuCoreCount: 6 },
		{ ramGB: 16, platform: "ios", deviceType: "tablet", cpuCoreCount: 8 },
	];

	for (const [cardKey, card] of Object.entries(whisperLLMCardsJson.cards)) {
		if (card.runtime) {
			for (const device of deviceTiers) {
				const resolved = await resolveRuntimeConfig(card.runtime, device);

				// Verify resolved config has valid structure
				t.is(typeof resolved.n_ctx, "number", `${cardKey}: n_ctx should resolve to number`);
				t.true(resolved.n_ctx > 0, `${cardKey}: n_ctx should be positive`);
				t.is(typeof resolved.n_predict, "number", `${cardKey}: n_predict should resolve to number`);
				t.true(Array.isArray(resolved.stop), `${cardKey}: stop should be array`);
				t.is(typeof resolved.sampling.temperature, "number", `${cardKey}: temperature should resolve to number`);
				t.is(typeof resolved.sampling.top_p, "number", `${cardKey}: top_p should resolve to number`);
			}
		}
	}
});

test("handles device without optional fields", async (t) => {
	const minimalDevice: DeviceCapabilities = {
		ramGB: 4,
		platform: "android",
	};

	const config: RuntimeConfig = {
		n_ctx: "$ramGB < 4 ? 1024 : 2048",
		n_threads: "$cpuCoreCount ? $cpuCoreCount : 4", // Should fallback to 4
		n_predict: -1,
		sampling: { temperature: 0.7, top_p: 0.95 },
		stop: [],
		roles: { user: "user", assistant: "assistant", system: "system" },
	};

	const resolved = await resolveRuntimeConfig(config, minimalDevice);
	t.is(resolved.n_ctx, 2048);
	t.is(resolved.n_threads, 4, "Should fallback when cpuCoreCount is undefined");
});
