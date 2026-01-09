/// <reference path="../types.d.ts" />
import test from "ava";
import {
	whisperLLMCardsJson,
	type WhisperLLMCard,
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
