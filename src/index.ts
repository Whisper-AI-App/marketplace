export interface WhisperLLMCard {
	name: string;
	type: "gguf";
	sourceUrl: string;
	sizeGB: number;
	parametersB: number;
	ramGB: number;
}

export interface LLMCardCollection {
	[key: string]: WhisperLLMCard;
}

export interface WhisperLLMCardsJSON {
	version: string;
	recommendedCard: string;
	cards: LLMCardCollection;
}

export const whisperLLMCardsJson: WhisperLLMCardsJSON = {
	version: "0.0.0",

	recommendedCard: "llama-3.2-1b-instruct-q4_0",

	cards: {
		"llama-3.2-1b-instruct-q4_0": {
			name: "Llama 3.2 1B Instruct Q4_0",
			type: "gguf",
			sourceUrl:
				"https://huggingface.co/unsloth/Llama-3.2-1B-Instruct-GGUF/resolve/main/Llama-3.2-1B-Instruct-Q4_0.gguf",
			sizeGB: 0.7,
			parametersB: 1,
			ramGB: 1.5,
		},
	},
};

export async function getLatestConfig(
	latestConfigUrl: string = "https://raw.githubusercontent.com/Ava-Technologies-Org/whisper-llm-cards/refs/heads/main/cards.json",
): Promise<WhisperLLMCardsJSON> {
	const response = await fetch(latestConfigUrl);

	if (!response.ok) {
		throw new Error(
			`Failed to fetch config: ${response.status} ${response.statusText}`,
		);
	}

	const data = await response.json();

	// Transform the JSON structure to match WhisperLLMCardsJSON format
	const cardsData = data.cards;
	return {
		version: data.version,
		recommendedCard: data.recommendedCard
			? data.recommendedCard
			: Object.keys(cardsData)[0], // Use first model as recommended if not specified
		cards: cardsData,
	};
}
