/// <reference path="../types.d.ts" />
import test from "ava";
import {
	getLatestConfig,
	type WhisperLLMCard,
} from "../src";

// Tests for getLatestConfig function
test("getLatestConfig returns a promise", (t) => {
	// Mock fetch to avoid actual network call
	const originalFetch = globalThis.fetch;
	globalThis.fetch = async (url: string | URL | Request) => {
		const urlString = url.toString();

		// Mock versions.json
		if (urlString.includes("versions.json")) {
			return {
				ok: true,
				json: async () => ({
					latest: "1.0.0",
					channels: { "1": "1.0.0", "1.0": "1.0.0" },
				}),
			} as Response;
		}

		// Mock cards.json
		return {
			ok: true,
			json: async () => ({ version: "1.0.0", defaultRecommendedCard: "test", cards: {} }),
		} as Response;
	};

	const result = getLatestConfig();
	t.true(result instanceof Promise);

	// Restore original fetch
	globalThis.fetch = originalFetch;
});

// Skip network tests by default - enable with: ava --match '*network*'
test("getLatestConfig fetches and returns valid config (network)", async (t) => {
	// Use main branch URL for testing since tags won't exist until after release
	const config = await getLatestConfig(
		"https://avatechnologies.org/whisper-llm-cards/refs/heads/main/cards.json",
	);

	t.truthy(config);
	t.is(typeof config, "object");
	t.truthy(config.version);
	t.is(typeof config.version, "string");
	t.truthy(config.defaultRecommendedCard);
	t.is(typeof config.defaultRecommendedCard, "string");
	t.truthy(config.cards);
	t.is(typeof config.cards, "object");
});

test("getLatestConfig returns cards with valid structure (network)", async (t) => {
	// Use main branch URL for testing since tags won't exist until after release
	const config = await getLatestConfig(
		"https://avatechnologies.org/whisper-llm-cards/refs/heads/main/cards.json",
	);

	t.true(Object.keys(config.cards).length > 0);

	for (const [key, card] of Object.entries(config.cards) as [
		string,
		WhisperLLMCard,
	][]) {
		t.is(typeof key, "string");
		t.is(typeof card.name, "string");
		t.is(card.type, "gguf");
		t.is(typeof card.sourceUrl, "string");
		t.true(card.sourceUrl.startsWith("http"));
		t.is(typeof card.sizeGB, "number");
		t.is(typeof card.parametersB, "number");
		t.is(typeof card.ramGB, "number");
	}
});

test("getLatestConfig defaultRecommendedCard exists in returned cards (network)", async (t) => {
	// Use main branch URL for testing since tags won't exist until after release
	const config = await getLatestConfig(
		"https://avatechnologies.org/whisper-llm-cards/refs/heads/main/cards.json",
	);

	t.truthy(config.cards[config.defaultRecommendedCard]);
});

test("getLatestConfig handles network errors gracefully", async (t) => {
	// Mock fetch to simulate network error for cards.json
	// Pass explicit URL to bypass versions.json lookup
	const originalFetch = globalThis.fetch;
	globalThis.fetch = async () => {
		return {
			ok: false,
			status: 404,
			statusText: "Not Found",
		} as Response;
	};

	const error = await t.throwsAsync(async () => {
		await getLatestConfig("https://example.com/cards.json");
	});

	t.truthy(error);
	t.true(error?.message.includes("Failed to fetch config"));

	// Restore original fetch
	globalThis.fetch = originalFetch;
});

test("getLatestConfig uses first model as defaultRecommendedCard if not specified", async (t) => {
	// Mock fetch to return data without defaultRecommendedCard
	const originalFetch = globalThis.fetch;
	globalThis.fetch = async (url: string | URL | Request) => {
		const urlString = url.toString();

		// Mock versions.json
		if (urlString.includes("versions.json")) {
			return {
				ok: true,
				json: async () => ({
					latest: "1.0.0",
					channels: {
						"1": "1.0.0",
						"1.0": "1.0.0",
					},
				}),
			} as Response;
		}

		// Mock cards.json without defaultRecommendedCard
		return {
			ok: true,
			json: async () => ({
				version: "1.0.0",
				cards: {
					"model-1": {
						name: "Model 1",
						type: "gguf",
						sourceUrl: "https://example.com/model1.gguf",
						sizeGB: 1.0,
						parametersB: 1,
						ramGB: 2.0,
					},
					"model-2": {
						name: "Model 2",
						type: "gguf",
						sourceUrl: "https://example.com/model2.gguf",
						sizeGB: 2.0,
						parametersB: 2,
						ramGB: 4.0,
					},
				},
			}),
		} as Response;
	};

	const config = await getLatestConfig();

	t.is(config.defaultRecommendedCard, "model-1");
	t.truthy(config.cards["model-1"]);

	// Restore original fetch
	globalThis.fetch = originalFetch;
});
