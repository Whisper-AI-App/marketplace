/// <reference path="../types.d.ts" />
import test from "ava";
import { whisperLLMCardsJson, getLatestConfig } from "../src";

// Tests for whisperLLMCardsJson export
test("whisperLLMCardsJson has correct structure", (t) => {
	t.truthy(whisperLLMCardsJson);
	t.is(typeof whisperLLMCardsJson, "object");
	t.truthy(whisperLLMCardsJson.version);
	t.truthy(whisperLLMCardsJson.recommendedCard);
	t.truthy(whisperLLMCardsJson.cards);
});

test("whisperLLMCardsJson version is a string", (t) => {
	t.is(typeof whisperLLMCardsJson.version, "string");
});

test("whisperLLMCardsJson recommendedCard exists in cards", (t) => {
	const { recommendedCard, cards } = whisperLLMCardsJson;
	t.truthy(cards[recommendedCard]);
});

test("whisperLLMCardsJson cards is an object", (t) => {
	t.is(typeof whisperLLMCardsJson.cards, "object");
	t.true(Object.keys(whisperLLMCardsJson.cards).length > 0);
});

test("whisperLLMCardsJson recommended card has correct properties", (t) => {
	const { recommendedCard, cards } = whisperLLMCardsJson;
	const card = cards[recommendedCard];

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

// Tests for getLatestConfig function
test("getLatestConfig returns a promise", (t) => {
	const result = getLatestConfig();
	t.true(result instanceof Promise);
});

// Skip network tests by default - enable with: ava --match '*network*'
test("getLatestConfig fetches and returns valid config (network)", async (t) => {
	const config = await getLatestConfig();

	t.truthy(config);
	t.is(typeof config, "object");
	t.truthy(config.version);
	t.is(typeof config.version, "string");
	t.truthy(config.recommendedCard);
	t.is(typeof config.recommendedCard, "string");
	t.truthy(config.cards);
	t.is(typeof config.cards, "object");
});

test("getLatestConfig returns cards with valid structure (network)", async (t) => {
	const config = await getLatestConfig();

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

test("getLatestConfig recommendedCard exists in returned cards (network)", async (t) => {
	const config = await getLatestConfig();

	t.truthy(config.cards[config.recommendedCard]);
});

test("getLatestConfig handles network errors gracefully", async (t) => {
	// Mock fetch to simulate network error
	const originalFetch = globalThis.fetch;
	globalThis.fetch = async () => {
		return {
			ok: false,
			status: 404,
			statusText: "Not Found",
		} as Response;
	};

	const error = await t.throwsAsync(async () => {
		await getLatestConfig();
	});

	t.truthy(error);
	t.true(error?.message.includes("Failed to fetch config"));

	// Restore original fetch
	globalThis.fetch = originalFetch;
});

test("getLatestConfig uses first model as recommendedCard if not specified", async (t) => {
	// Mock fetch to return data without recommendedCard
	const originalFetch = globalThis.fetch;
	globalThis.fetch = async () => {
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

	t.is(config.recommendedCard, "model-1");
	t.truthy(config.cards["model-1"]);

	// Restore original fetch
	globalThis.fetch = originalFetch;
});
