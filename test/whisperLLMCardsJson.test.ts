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

// Tests for runtime config validation
test("cards with runtime config have valid structure", (t) => {
	const { cards } = whisperLLMCardsJson;

	for (const [key, card] of Object.entries(cards) as [string, WhisperLLMCard][]) {
		if (card.runtime) {
			const runtime = card.runtime;

			// Validate n_ctx if present
			if (runtime.n_ctx !== undefined) {
				t.is(typeof runtime.n_ctx, "number", `${key}: n_ctx should be number`);
				t.true(runtime.n_ctx > 0, `${key}: n_ctx should be positive`);
			}

			// Validate flash_attn if present
			if (runtime.flash_attn !== undefined) {
				t.is(typeof runtime.flash_attn, "boolean", `${key}: flash_attn should be boolean`);
			}

			// Validate cache_type_k if present
			if (runtime.cache_type_k !== undefined) {
				t.true(
					["f16", "f32", "q8_0", "q4_0"].includes(runtime.cache_type_k),
					`${key}: cache_type_k should be valid type`,
				);
			}

			// Validate cache_type_v if present
			if (runtime.cache_type_v !== undefined) {
				t.true(
					["f16", "f32", "q8_0", "q4_0"].includes(runtime.cache_type_v),
					`${key}: cache_type_v should be valid type`,
				);
			}

			// Validate n_predict if present (-1 means unlimited)
			if (runtime.n_predict !== undefined) {
				t.is(typeof runtime.n_predict, "number", `${key}: n_predict should be number`);
				t.true(runtime.n_predict > 0 || runtime.n_predict === -1, `${key}: n_predict should be positive or -1 (unlimited)`);
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
					t.is(typeof sampling.temperature, "number", `${key}: temperature should be number`);
					t.true(sampling.temperature >= 0 && sampling.temperature <= 2, `${key}: temperature should be 0-2`);
				}

				if (sampling.top_k !== undefined) {
					t.is(typeof sampling.top_k, "number", `${key}: top_k should be number`);
					t.true(sampling.top_k > 0, `${key}: top_k should be positive`);
				}

				if (sampling.top_p !== undefined) {
					t.is(typeof sampling.top_p, "number", `${key}: top_p should be number`);
					t.true(sampling.top_p > 0 && sampling.top_p <= 1, `${key}: top_p should be 0-1`);
				}

				if (sampling.min_p !== undefined) {
					t.is(typeof sampling.min_p, "number", `${key}: min_p should be number`);
					t.true(sampling.min_p >= 0 && sampling.min_p <= 1, `${key}: min_p should be 0-1`);
				}

				if (sampling.penalty_repeat !== undefined) {
					t.is(typeof sampling.penalty_repeat, "number", `${key}: penalty_repeat should be number`);
					t.true(sampling.penalty_repeat >= 1, `${key}: penalty_repeat should be >= 1`);
				}

				if (sampling.penalty_last_n !== undefined) {
					t.is(typeof sampling.penalty_last_n, "number", `${key}: penalty_last_n should be number`);
					t.true(sampling.penalty_last_n >= 0, `${key}: penalty_last_n should be >= 0`);
				}

				if (sampling.seed !== undefined) {
					t.is(typeof sampling.seed, "number", `${key}: seed should be number`);
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
