/// <reference path="../types.d.ts" />
import test from "ava";
import {
	whisperLLMCardsJson,
	processSystemMessage,
	templateVariables,
	type Message,
	type WhisperLLMCard,
} from "../src";

// Tests for processSystemMessage function
test("processSystemMessage replaces date_time_string template variable", (t) => {
	const mockCard: WhisperLLMCard = {
		name: "Test Card",
		type: "gguf",
		sourceUrl: "https://example.com/model.gguf",
		sizeGB: 1.0,
		parametersB: 1,
		ramGB: 2.0,
		systemMessage: {
			template: "Today's date is {date_time_string}.",
			defaultTemplateValues: {
				date_time_string: templateVariables.date_time_string.defaultValue,
			},
		},
	};
	const messages: Message[] = [];

	const result = processSystemMessage(mockCard, messages);

	// Should contain a date/time string (not the placeholder or default)
	t.false(result.includes("{date_time_string}"));
	t.true(result.startsWith("Today's date is "));
	const minExpectedLength = `Today's date is ${templateVariables.date_time_string.defaultValue}.`.length;
	t.true(result.length > minExpectedLength);
	t.is(typeof result, "string");
});

test("processSystemMessage handles template with no variables", (t) => {
	const mockCard: WhisperLLMCard = {
		name: "Test Card",
		type: "gguf",
		sourceUrl: "https://example.com/model.gguf",
		sizeGB: 1.0,
		parametersB: 1,
		ramGB: 2.0,
		systemMessage: {
			template: "You are a helpful assistant.",
			defaultTemplateValues: {},
		},
	};
	const messages: Message[] = [];

	const result = processSystemMessage(mockCard, messages);

	t.is(result, "You are a helpful assistant.");
});

test("processSystemMessage replaces multiple occurrences of same variable", (t) => {
	const mockCard: WhisperLLMCard = {
		name: "Test Card",
		type: "gguf",
		sourceUrl: "https://example.com/model.gguf",
		sizeGB: 1.0,
		parametersB: 1,
		ramGB: 2.0,
		systemMessage: {
			template: "Date: {date_time_string}. I repeat: {date_time_string}",
			defaultTemplateValues: {
				date_time_string: templateVariables.date_time_string.defaultValue,
			},
		},
	};
	const messages: Message[] = [];

	const result = processSystemMessage(mockCard, messages);

	// Should not contain any placeholder braces
	t.false(result.includes("{date_time_string}"));
	t.true(result.startsWith("Date: "));
	// Both occurrences should be replaced
	const parts = result.split("I repeat: ");
	t.is(parts.length, 2);
	t.true(parts[1].length > 0);
});

test("processSystemMessage uses card default for unknown variables", (t) => {
	const mockCard: WhisperLLMCard = {
		name: "Test Card",
		type: "gguf",
		sourceUrl: "https://example.com/model.gguf",
		sizeGB: 1.0,
		parametersB: 1,
		ramGB: 2.0,
		systemMessage: {
			template: "Model: {model_name}, Version: {version}",
			defaultTemplateValues: {
				model_name: "TestModel",
				version: "1.0",
			},
		},
	};
	const messages: Message[] = [];

	const result = processSystemMessage(mockCard, messages);

	t.is(result, "Model: TestModel, Version: 1.0");
});

test("processSystemMessage preserves unknown variables without defaults", (t) => {
	const mockCard: WhisperLLMCard = {
		name: "Test Card",
		type: "gguf",
		sourceUrl: "https://example.com/model.gguf",
		sizeGB: 1.0,
		parametersB: 1,
		ramGB: 2.0,
		systemMessage: {
			template: "Hello {unknown_variable}!",
			defaultTemplateValues: {},
		},
	};
	const messages: Message[] = [];

	const result = processSystemMessage(mockCard, messages);

	// Unknown variable without default should remain as-is
	t.is(result, "Hello {unknown_variable}!");
});

test("processSystemMessage handles empty template", (t) => {
	const mockCard: WhisperLLMCard = {
		name: "Test Card",
		type: "gguf",
		sourceUrl: "https://example.com/model.gguf",
		sizeGB: 1.0,
		parametersB: 1,
		ramGB: 2.0,
		systemMessage: {
			template: "",
			defaultTemplateValues: {},
		},
	};
	const messages: Message[] = [];

	const result = processSystemMessage(mockCard, messages);

	t.is(result, "");
});

test("processSystemMessage handles mix of known and unknown variables", (t) => {
	const mockCard: WhisperLLMCard = {
		name: "Test Card",
		type: "gguf",
		sourceUrl: "https://example.com/model.gguf",
		sizeGB: 1.0,
		parametersB: 1,
		ramGB: 2.0,
		systemMessage: {
			template:
				"Date: {date_time_string}, Custom: {custom_var}, Unknown: {unknown}",
			defaultTemplateValues: {
				custom_var: "my_value",
			},
		},
	};
	const messages: Message[] = [];

	const result = processSystemMessage(mockCard, messages);

	// date_time_string should be resolved
	t.false(result.includes("{date_time_string}"));
	// custom_var should use card default
	t.true(result.includes("Custom: my_value"));
	// unknown should remain as-is
	t.true(result.includes("Unknown: {unknown}"));
});

test("processSystemMessage accepts Message array parameter", (t) => {
	const mockCard: WhisperLLMCard = {
		name: "Test Card",
		type: "gguf",
		sourceUrl: "https://example.com/model.gguf",
		sizeGB: 1.0,
		parametersB: 1,
		ramGB: 2.0,
		systemMessage: {
			template: "System message",
			defaultTemplateValues: {},
		},
	};

	// Test with various message types
	const messages: Message[] = [
		{ role: "system", content: "System prompt" },
		{ role: "user", content: "User message" },
		{ role: "assistant", content: "Assistant response" },
	];

	const result = processSystemMessage(mockCard, messages);

	// Should process successfully regardless of messages content
	t.is(result, "System message");
	t.is(typeof result, "string");
});

test("processSystemMessage works with actual whisperLLMCardsJson data", (t) => {
	const { cards, defaultRecommendedCard } = whisperLLMCardsJson;
	const card = cards[defaultRecommendedCard];
	t.truthy(card, "defaultRecommendedCard should reference an existing card");
	const messages: Message[] = [];

	const result = processSystemMessage(card, messages);

	// Should process the actual template without leftover placeholders
	t.false(result.includes("{date_time_string}"));
	t.true(result.length > 0);
	t.is(typeof result, "string");
});
