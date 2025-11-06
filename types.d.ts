// Type definitions for whisper-llm-cards

declare global {
	interface WhisperLLMCard {
		name: string;
		type: "gguf";
		sourceUrl: string;
		sizeGB: number;
		parametersB: number;
		ramGB: number;
	}

	interface LLMCardCollection {
		[key: string]: WhisperLLMCard;
	}

	interface WhisperLLMCardsJSON {
		version: string;
		recommendedCard: string;
		cards: LLMCardCollection;
	}
}

export {};
