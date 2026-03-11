/// <reference path="../types.d.ts" />
import test from "ava";
import {
	whisperLLMCardsJson,
	type WhisperLLMCard,
	type RuntimeConfig,
	type SamplingParams,
	DEFAULT_SAMPLING,
	DEFAULT_ROLES,
	DEFAULT_RUNTIME_CONFIG,
} from "../src";

// Tests for whisperLLMCardsJson export
test("whisperLLMCardsJson has correct structure", (t) => {
	t.truthy(whisperLLMCardsJson);
	t.is(typeof whisperLLMCardsJson, "object");
	t.truthy(whisperLLMCardsJson.version);
	t.truthy(whisperLLMCardsJson.defaultRecommendedCard);
	t.truthy(whisperLLMCardsJson.cards);
});

test("whisperLLMCardsJson version is a string", (t) => {
	t.is(typeof whisperLLMCardsJson.version, "string");
});

test("whisperLLMCardsJson defaultRecommendedCard exists in cards", (t) => {
	const { defaultRecommendedCard, cards } = whisperLLMCardsJson;
	t.truthy(cards[defaultRecommendedCard]);
});

test("whisperLLMCardsJson cards is an object", (t) => {
	t.is(typeof whisperLLMCardsJson.cards, "object");
	t.true(Object.keys(whisperLLMCardsJson.cards).length > 0);
});

test("whisperLLMCardsJson default recommended card has correct properties", (t) => {
	const { defaultRecommendedCard, cards } = whisperLLMCardsJson;
	const card = cards[defaultRecommendedCard];

	t.truthy(card);
	t.is(typeof card.name, "string");
	t.is(card.type, "gguf");
	t.is(typeof card.sourceUrl, "string");
	t.is(typeof card.sizeGB, "number");
	t.is(typeof card.parametersB, "number");
	t.is(typeof card.ramGB, "number");
});

test("whisperLLMCardsJson all cards have valid structure", (t) => {
	const { cards } = whisperLLMCardsJson;

	for (const [key, card] of Object.entries(cards) as [
		string,
		WhisperLLMCard,
	][]) {
		t.is(typeof key, "string");
		t.is(typeof card.name, "string");
		t.is(card.type, "gguf");
		t.is(typeof card.sourceUrl, "string");
		t.true(card.sourceUrl.startsWith("http"));
		t.is(typeof card.sizeGB, "number");
		t.true(card.sizeGB > 0);
		t.is(typeof card.parametersB, "number");
		t.true(card.parametersB > 0);
		t.is(typeof card.ramGB, "number");
		t.true(card.ramGB > 0);
	}
});

test("whisperLLMCardsJson card values are within reasonable ranges", (t) => {
	const { cards } = whisperLLMCardsJson;

	for (const card of Object.values(cards) as WhisperLLMCard[]) {
		// Size should be between 0.1GB and 1000GB
		t.true(card.sizeGB >= 0.1 && card.sizeGB <= 1000);
		// Parameters should be between 0.1B and 1000B
		t.true(card.parametersB >= 0.1 && card.parametersB <= 1000);
		// RAM should be between 0.1GB and 10000GB
		t.true(card.ramGB >= 0.1 && card.ramGB <= 10000);
	}
});

// Tests for default values exports
test("DEFAULT_SAMPLING has all required fields", (t) => {
	t.is(typeof DEFAULT_SAMPLING.temperature, "number");
	t.is(typeof DEFAULT_SAMPLING.top_k, "number");
	t.is(typeof DEFAULT_SAMPLING.top_p, "number");
	t.is(typeof DEFAULT_SAMPLING.min_p, "number");
	t.is(typeof DEFAULT_SAMPLING.penalty_repeat, "number");
	t.is(typeof DEFAULT_SAMPLING.penalty_last_n, "number");
	t.is(typeof DEFAULT_SAMPLING.seed, "number");
});

test("DEFAULT_ROLES has all required fields", (t) => {
	t.is(DEFAULT_ROLES.user, "user");
	t.is(DEFAULT_ROLES.assistant, "assistant");
	t.is(DEFAULT_ROLES.system, "system");
});

test("DEFAULT_RUNTIME_CONFIG has correct structure", (t) => {
	t.is(typeof DEFAULT_RUNTIME_CONFIG.n_ctx, "number");
	t.is(typeof DEFAULT_RUNTIME_CONFIG.n_predict, "number");
	t.truthy(DEFAULT_RUNTIME_CONFIG.sampling);
	t.true(Array.isArray(DEFAULT_RUNTIME_CONFIG.stop));
	t.truthy(DEFAULT_RUNTIME_CONFIG.roles);
});

// Helper to check if a value is a valid expression string or matches expected type
const isExprOrType = (value: unknown, expectedType: string): boolean => {
	if (typeof value === "string" && value.startsWith("$")) return true; // Expression string
	return typeof value === expectedType;
};

const isExprOrOneOf = (value: unknown, validValues: string[]): boolean => {
	if (typeof value === "string" && value.startsWith("$")) return true; // Expression string
	return typeof value === "string" && validValues.includes(value);
};

const VALID_CACHE_TYPES = ["f16", "f32", "q8_0", "q5_1", "q5_0", "q4_1", "q4_0", "iq4_nl"];

// Tests for runtime config validation
test("cards with runtime config have valid structure", (t) => {
	const { cards } = whisperLLMCardsJson;

	for (const [key, card] of Object.entries(cards) as [string, WhisperLLMCard][]) {
		if (card.runtime) {
			const runtime = card.runtime;

			// Validate n_ctx if present (number or expression)
			if (runtime.n_ctx !== undefined) {
				t.true(isExprOrType(runtime.n_ctx, "number"), `${key}: n_ctx should be number or expression`);
				if (typeof runtime.n_ctx === "number") {
					t.true(runtime.n_ctx > 0, `${key}: n_ctx should be positive`);
				}
			}

			// Validate n_gpu_layers if present (number or expression)
			if (runtime.n_gpu_layers !== undefined) {
				t.true(isExprOrType(runtime.n_gpu_layers, "number"), `${key}: n_gpu_layers should be number or expression`);
			}

			// Validate n_threads if present (number or expression)
			if (runtime.n_threads !== undefined) {
				t.true(isExprOrType(runtime.n_threads, "number"), `${key}: n_threads should be number or expression`);
			}

			// Validate flash_attn if present (boolean or expression)
			if (runtime.flash_attn !== undefined) {
				t.true(isExprOrType(runtime.flash_attn, "boolean"), `${key}: flash_attn should be boolean or expression`);
			}

			// Validate cache_type_k if present (valid enum or expression)
			if (runtime.cache_type_k !== undefined) {
				t.true(
					isExprOrOneOf(runtime.cache_type_k, VALID_CACHE_TYPES),
					`${key}: cache_type_k should be valid type or expression`,
				);
			}

			// Validate cache_type_v if present (valid enum or expression)
			if (runtime.cache_type_v !== undefined) {
				t.true(
					isExprOrOneOf(runtime.cache_type_v, VALID_CACHE_TYPES),
					`${key}: cache_type_v should be valid type or expression`,
				);
			}

			// Validate n_predict if present (number or expression)
			if (runtime.n_predict !== undefined) {
				t.true(isExprOrType(runtime.n_predict, "number"), `${key}: n_predict should be number or expression`);
				if (typeof runtime.n_predict === "number") {
					t.true(runtime.n_predict > 0 || runtime.n_predict === -1, `${key}: n_predict should be positive or -1 (unlimited)`);
				}
			}

			// Validate stop if present
			if (runtime.stop !== undefined) {
				t.true(Array.isArray(runtime.stop), `${key}: stop should be array`);
				for (const stopWord of runtime.stop) {
					t.is(typeof stopWord, "string", `${key}: stop words should be strings`);
				}
			}

			// Validate sampling params if present
			if (runtime.sampling) {
				const sampling = runtime.sampling;

				if (sampling.temperature !== undefined) {
					t.true(isExprOrType(sampling.temperature, "number"), `${key}: temperature should be number or expression`);
					if (typeof sampling.temperature === "number") {
						t.true(sampling.temperature >= 0 && sampling.temperature <= 2, `${key}: temperature should be 0-2`);
					}
				}

				if (sampling.top_k !== undefined) {
					t.true(isExprOrType(sampling.top_k, "number"), `${key}: top_k should be number or expression`);
					if (typeof sampling.top_k === "number") {
						t.true(sampling.top_k > 0, `${key}: top_k should be positive`);
					}
				}

				if (sampling.top_p !== undefined) {
					t.true(isExprOrType(sampling.top_p, "number"), `${key}: top_p should be number or expression`);
					if (typeof sampling.top_p === "number") {
						t.true(sampling.top_p > 0 && sampling.top_p <= 1, `${key}: top_p should be 0-1`);
					}
				}

				if (sampling.min_p !== undefined) {
					t.true(isExprOrType(sampling.min_p, "number"), `${key}: min_p should be number or expression`);
					if (typeof sampling.min_p === "number") {
						t.true(sampling.min_p >= 0 && sampling.min_p <= 1, `${key}: min_p should be 0-1`);
					}
				}

				if (sampling.penalty_repeat !== undefined) {
					t.true(isExprOrType(sampling.penalty_repeat, "number"), `${key}: penalty_repeat should be number or expression`);
					if (typeof sampling.penalty_repeat === "number") {
						t.true(sampling.penalty_repeat >= 1, `${key}: penalty_repeat should be >= 1`);
					}
				}

				if (sampling.penalty_last_n !== undefined) {
					t.true(isExprOrType(sampling.penalty_last_n, "number"), `${key}: penalty_last_n should be number or expression`);
					if (typeof sampling.penalty_last_n === "number") {
						t.true(sampling.penalty_last_n >= 0, `${key}: penalty_last_n should be >= 0`);
					}
				}

				if (sampling.seed !== undefined) {
					t.true(isExprOrType(sampling.seed, "number"), `${key}: seed should be number or expression`);
				}
			}

			// Validate roles if present
			if (runtime.roles) {
				const roles = runtime.roles;

				if (roles.user !== undefined) {
					t.is(typeof roles.user, "string", `${key}: roles.user should be string`);
				}

				if (roles.assistant !== undefined) {
					t.is(typeof roles.assistant, "string", `${key}: roles.assistant should be string`);
				}

				if (roles.system !== undefined) {
					t.is(typeof roles.system, "string", `${key}: roles.system should be string`);
				}
			}
		}
	}
});

test("default recommended card has runtime config", (t) => {
	const { defaultRecommendedCard, cards } = whisperLLMCardsJson;
	const card = cards[defaultRecommendedCard];

	t.truthy(card.runtime, "Default recommended card should have runtime config");
	t.truthy(card.runtime?.sampling, "Default recommended card should have sampling config");
	t.true(Array.isArray(card.runtime?.stop), "Default recommended card should have stop array");
});

// T009: Qwen3.5 card validation tests

test("all 3 model cards exist", (t) => {
	const { cards } = whisperLLMCardsJson;
	t.truthy(cards["lfm2.5-1.2b-instruct-q6_k"], "LFM2.5 1.2B should exist");
	t.truthy(cards["qwen3.5-2b-q4_k_m"], "Qwen3.5 2B should exist");
	t.truthy(cards["qwen3.5-4b-q4_k_m"], "Qwen3.5 4B should exist");
});

test("Qwen3.5 2B card has correct fields", (t) => {
	const card = whisperLLMCardsJson.cards["qwen3.5-2b-q4_k_m"];
	t.truthy(card);
	t.is(card.type, "gguf");
	t.is(card.parametersB, 2);
	t.is(card.ramGB, 3);
	t.true(card.sourceUrl.includes("Qwen3.5-2B"));
	t.truthy(card.runtime);
	t.is(card.multimodal, undefined, "Qwen3.5 2B should have no multimodal");
});

test("Qwen3.5 4B card has multimodal config with mmproj", (t) => {
	const card = whisperLLMCardsJson.cards["qwen3.5-4b-q4_k_m"];
	t.truthy(card);
	t.is(card.parametersB, 4);
	t.truthy(card.multimodal);
	t.truthy(card.multimodal?.mmproj);
	t.true(card.multimodal!.mmproj!.sourceUrl.includes("mmproj"));
	t.is(card.multimodal!.mmproj!.sizeGB, 0.66);
});

test("Qwen3.5 4B vision config has all required fields", (t) => {
	const vision = whisperLLMCardsJson.cards["qwen3.5-4b-q4_k_m"].multimodal?.vision;
	t.truthy(vision, "4B should have vision config");
	t.truthy(vision!.enabled);
	t.truthy(vision!.maxWidth);
	t.truthy(vision!.maxHeight);
	t.true(Array.isArray(vision!.supportedFormats));
	t.true(vision!.supportedFormats!.includes("jpeg"));
});
