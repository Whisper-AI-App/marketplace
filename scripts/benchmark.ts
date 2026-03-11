import { mkdirSync, copyFileSync, writeFileSync, existsSync, createWriteStream } from "node:fs";
import { resolve, dirname, basename } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline";
import { whisperLLMCardsJson, processSystemMessage } from "../src/index.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");

function promptChoice(question: string, choices: string[]): Promise<string> {
	const rl = createInterface({ input: process.stdin, output: process.stdout });
	console.log(question);
	for (let i = 0; i < choices.length; i++) {
		const card = whisperLLMCardsJson.cards[choices[i]];
		console.log(`  ${i + 1}) ${choices[i]}  (${card.name}, ${card.parametersB}B, ${card.sizeGB} GB)`);
	}
	return new Promise((resolve) => {
		rl.question("\nEnter number: ", (answer) => {
			rl.close();
			const idx = Number.parseInt(answer, 10) - 1;
			if (idx >= 0 && idx < choices.length) {
				resolve(choices[idx]);
			} else {
				console.error("Invalid selection.");
				process.exit(1);
			}
		});
	});
}

// Parse CLI args
const args = process.argv.slice(2);
const modelIdx = args.indexOf("--model");
const presetIdx = args.indexOf("--preset");
const maxTokensIdx = args.indexOf("--max-tokens");

let modelName = modelIdx !== -1 ? args[modelIdx + 1] : undefined;
const preset = presetIdx !== -1 ? args[presetIdx + 1] : undefined;
const maxTokens = maxTokensIdx !== -1 ? args[maxTokensIdx + 1] : undefined;

const availableModels = Object.keys(whisperLLMCardsJson.cards);

if (!modelName) {
	modelName = await promptChoice("\nSelect a model to benchmark:", availableModels);
}

if (!availableModels.includes(modelName)) {
	console.error(`Error: Unknown model "${modelName}".\n`);
	modelName = await promptChoice("\nSelect a model to benchmark:", availableModels);
}

if (preset && !["low", "medium", "high", "ultra"].includes(preset)) {
	console.error(
		`Error: Invalid preset "${preset}". Must be one of: low, medium, high, ultra`,
	);
	process.exit(1);
}

const card = whisperLLMCardsJson.cards[modelName];

// Print model metadata
console.log("\n--- Model Metadata ---");
console.log(`Name:       ${card.name}`);
console.log(`Parameters: ${card.parametersB}B`);
console.log(`Size:       ${card.sizeGB} GB`);
console.log(`Source:     ${card.sourceUrl}`);
console.log("----------------------\n");

// Set up .nanotune directory
const nanotuneDir = resolve(rootDir, ".nanotune");
const nanotuneBenchDir = resolve(nanotuneDir, "benchmarks");
const modelsDir = resolve(nanotuneDir, "models");

mkdirSync(nanotuneBenchDir, { recursive: true });
mkdirSync(modelsDir, { recursive: true });

// Download model if not already cached
const modelFileName = basename(card.sourceUrl);
const localModelPath = resolve(modelsDir, modelFileName);

if (!existsSync(localModelPath)) {
	console.log(`Downloading ${modelFileName} (${card.sizeGB} GB)...`);
	console.log(`From: ${card.sourceUrl}\n`);

	const response = await fetch(card.sourceUrl);
	if (!response.ok || !response.body) {
		console.error(`Error: Failed to download model (HTTP ${response.status})`);
		process.exit(1);
	}

	const fileStream = createWriteStream(localModelPath);
	const reader = response.body.getReader();
	const contentLength = Number(response.headers.get("content-length") ?? 0);
	let downloaded = 0;

	while (true) {
		const { done, value } = await reader.read();
		if (done) break;
		fileStream.write(value);
		downloaded += value.length;
		if (contentLength > 0) {
			const pct = ((downloaded / contentLength) * 100).toFixed(1);
			const mb = (downloaded / 1024 / 1024).toFixed(0);
			const totalMb = (contentLength / 1024 / 1024).toFixed(0);
			process.stdout.write(`\r  ${pct}% (${mb}/${totalMb} MB)`);
		}
	}

	await new Promise<void>((resolve, reject) => {
		fileStream.end(() => resolve());
		fileStream.on("error", reject);
	});
	console.log("\n  Download complete.\n");
} else {
	console.log(`Using cached model: ${localModelPath}\n`);
}

// Resolve the card's system prompt with template variables
const systemPrompt = processSystemMessage(card, []);

// Write nanotune config (must match ConfigSchema so loadConfig() succeeds and systemPrompt is used)
const nanotuneConfig = {
	name: modelName,
	version: "1.0.0",
	baseModel: localModelPath,
	systemPrompt,
	training: {},
	export: {
		quantization: "q4_k_m",
		outputName: modelName,
	},
};

writeFileSync(
	resolve(nanotuneDir, "config.json"),
	JSON.stringify(nanotuneConfig, null, 2),
);

// Copy test data
const testsSource = resolve(rootDir, "benchmarks", "tests.json");
const testsDest = resolve(nanotuneBenchDir, "tests.json");

if (!existsSync(testsSource)) {
	console.error("Error: benchmarks/tests.json not found.");
	process.exit(1);
}

copyFileSync(testsSource, testsDest);

// Build spawn args — default to "high" preset unless explicitly specified
const spawnArgs = ["nanotune", "benchmark"];
spawnArgs.push("--preset", preset ?? "high");
if (maxTokens) {
	spawnArgs.push("--max-tokens", maxTokens);
} else if (!preset) {
	// Default to 2048 tokens when no preset explicitly specified
	spawnArgs.push("--max-tokens", "2048");
}

console.log(`Running: npx ${spawnArgs.join(" ")}\n`);

const result = spawnSync("npx", spawnArgs, {
	cwd: rootDir,
	stdio: "inherit",
});

process.exit(result.status ?? 1);
